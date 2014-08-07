(function ($) {
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    // the above from http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb

    function bufferToArray(buffer) {
        var newArray = [],
            i;

        for (i = 0; i < buffer.length; i++) {
            newArray.push(buffer[i]);
        }
        return newArray;
    }

    function audioClipEmpty(buffer, minimumLength) {
        var newArray = [],
            minLength = minimumLength || parseInt(buffer.length * 0.75),
            i;

        for (i = 0; i < buffer.length; i++) {
            if (i < minLength || buffer[i] !== 0) {
                newArray.push(buffer[i]);
            }
        }
        return newArray;
    }

    function audioDetectBeat(bufferFrames, sensitivity) {
        var averages = [],
            averageChanges = [],
            i, i2, bufferTotal, averageChange;

        for (i = 0; i < bufferFrames.length; i++) {
            bufferTotal = 0;
            for (i2 = 0; i2 < bufferFrames[i].length; i2++) {
                bufferTotal += bufferFrames[i][i2];
            }

            averages.push(bufferTotal / bufferFrames[i].length);
        }

        for (i = 0; i < averages.length - 1; i++) {
            averageChanges.push(Math.abs(averages[i] - averages + 1));
        }

        for (i = 0; i < averageChanges.length; i++) {
            averageChange += averageChanges[i];
        }

        averageChange = averageChange / averageChanges.length;

        console.clear();
        console.log(averageChange);
    }

    function Visualizer(config) {
        var me = this;

        me.name = config.name;
        me.fftSize = config.fftSize;
        me.filters = config.filters;

        me.render = config.render.bind(me);
    }

    function Trivisualizer(config) {
        var me = this,
            defaults = $.fn.trivisualizer.defaults,
            defaultVisualizer = config.defaultVisualizer || 'bars',
            stage = new PIXI.Stage(0x000000),
            canvas = config.canvas ? $(config.canvas)[0] : $('canvas')[0],
            $canvas = $(canvas),
            renderer = PIXI.autoDetectRenderer($canvas.width(), $canvas.height(), canvas),
            graphics = new PIXI.Graphics(renderer.view),
            audioContext = new webkitAudioContext(),
            audioSource = audioContext.createMediaElementSource($('.trivisualizer-audio')[0]),
            audioAnalyser = audioContext.createAnalyser(),
            visualizers = [],
            activeVisualizer, i;

        for (i = 0; i < defaults.visualizers.length; i++) {
            visualizers.push(new Visualizer(defaults.visualizers[i]));
        }

        audioSource.connect(audioAnalyser);
        audioAnalyser.connect(audioContext.destination);
        me.renderTarget = canvas;

        stage.addChild(graphics);

        me.start = function () {
            setInterval(render, 16);
        };

        me.setVisualizer = function (name) {
            for (var i = 0; i < visualizers.length; i++) {
                if (visualizers[i].name === name) {
                    activeVisualizer = visualizers[i];
                    break;
                }
            }

            audioAnalyser.fftSize = activeVisualizer.fftSize;
            $canvas.css('-webkit-filter', activeVisualizer.filters);
        };

        me.addVisualizer = function (config) {

        };

        function render() {
            var frequencyData;

            if (activeVisualizer) {
                frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
                audioAnalyser.getByteFrequencyData(frequencyData);

                activeVisualizer.render(bufferToArray(frequencyData), graphics, canvas);
                renderer.render(stage);
            }
        }

        me.setVisualizer(defaultVisualizer);
    }

    $.fn.trivisualizer = function(cfg) {
        var config = $.extend({
            canvas: this
        }, $.fn.trivisualizer.defaults, cfg);

        return new Trivisualizer(config);
    };

    $.fn.trivisualizer.defaults = {
        scroll: true, // scroll thru visualizers?
        interval: 30, // change visualizer every x seconds
        visualizers: [
            {
                render: function (buffer, g, canvas) {
                    var canvasWidth = canvas.width,
                        canvasHeight = canvas.height,
                        numBuckets = buffer.length,
                        barRegion = (canvasWidth / numBuckets),
                        barBaseline = canvasHeight * .7,
                        barWidth = barRegion * .8,
                        barOffset = barRegion / 2,
                        barX;

                    g.clear();
                    g.lineStyle(barWidth, 0xFF6600, 1);
                    for (var i = 0; i < buffer.length; i++) {
                        barX = barOffset + barRegion * i;
                        g.moveTo(barX, barBaseline);
                        g.lineTo(barX, barBaseline - buffer[i]);
                    }
                    g.lineStyle(barWidth, 0xCC0000, 0.8);
                    for (var i = 0; i < buffer.length; i++) {
                        barX = barOffset + barRegion * i;
                        g.moveTo(barX, barBaseline - buffer[i]);
                        g.lineTo(barX, barBaseline - buffer[i] - (buffer[i] * .1));
                    }
                    g.lineStyle(barWidth, 0xFF6600, 0.3);
                    for (i = 0; i < buffer.length; i++) {
                        barX = barOffset + barRegion * i;
                        g.moveTo(barX, barBaseline + 20);
                        g.lineTo(barX, barBaseline + 20 + buffer[i] / 2);
                    }
                },
                fftSize: 128,
                filters: '',
                name: 'bars'
            },
            {
                render: function (buffer, g, canvas) {
                    var canvasWidth = canvas.width,
                        canvasHeight = canvas.height,
                        buffer = audioClipEmpty(buffer),
                        numBuckets = buffer.length,
                        origin = {x: canvasWidth / 2, y: canvasHeight / 2},
                        centerOffset = canvasHeight * 0.05,
                        innerOffset = canvasHeight * 0.02,
                        edgePadding = canvasHeight * 0.02,
                        maxRadius = canvasHeight / 2,
                        radianSeparation = (2 * Math.PI) / numBuckets,
                        barWidth = 512 / numBuckets,
                        barX, barY;

                    g.clear();
                    g.lineStyle(barWidth, 0x0099FF, 1);
                    for (var i = 0; i < buffer.length; i++) {
                        barX = (centerOffset * Math.cos(radianSeparation * i)) + origin.x;
                        barY = (centerOffset * Math.sin(radianSeparation * i)) + origin.y;
                        endX = ((centerOffset + buffer[i]) * Math.cos(radianSeparation * i)) + origin.x;
                        endY = ((centerOffset + buffer[i]) * Math.sin(radianSeparation * i)) + origin.y;
                        g.moveTo(barX, barY);
                        g.lineTo(endX, endY);
                    }
                },
                fftSize: 2048,
                filters: '',
                name: 'blueDream'
            },
            {
                render: function (buffer, g, canvas) {
                    var canvasWidth = canvas.width,
                        canvasHeight = canvas.height,
                        buffer = audioClipEmpty(buffer),
                        numBuckets = buffer.length;

                    g.clear();
                    g.lineStyle(barWidth, 0x33FF33, 1);
                    for (var i = 0; i < buffer.length; i++) {

                    }
                },
                fftSize: 512,
                filters: '',
                name: 'wave'
            }]
        };
}(jQuery));