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

    function audioClipEmpty(buffer) {
        var newArray = [],
            i;

        for (i = 0; i < buffer.length; i++) {
            if (buffer[i] !== 0) {
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
        var me = this,
            stage = new PIXI.Stage(0x000000),
            $canvas = config.canvas ? $(config.canvas)[0] : $('canvas')[0],
            renderer = PIXI.autoDetectRenderer(1472, 736, $canvas),
            graphics = new PIXI.Graphics(renderer.view),
            activeVisualizer = config.activeVisualizer || 'bars',
            audioContext = new webkitAudioContext(),
            audioSource = audioContext.createMediaElementSource($('.trivisualizer-audio')[0]),
            audioAnalyser = audioContext.createAnalyser();

        audioAnalyser.fftSize = 256;

        audioSource.connect(audioAnalyser);
        audioAnalyser.connect(audioContext.destination);

        me.renderTarget = $canvas;

        stage.addChild(graphics);

        me.start = function () {
            setInterval(render, 16);
        };

        function render() {
            var frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
            audioAnalyser.getByteFrequencyData(frequencyData);

            $.fn.trivisualizer.defaults.visualizers[activeVisualizer](bufferToArray(frequencyData), graphics, $canvas);
            renderer.render(stage);
        }
    }

    $.fn.trivisualizer = function(cfg) {
        var config = $.extend({
            canvas: this
        }, $.fn.trivisualizer.defaults, cfg);

        return new Visualizer(config);
    };

    $.fn.trivisualizer.defaults = {
        scroll: true, // scroll thru visualizers?
        interval: 0, // x=0 change visualizer on audio change, x>0 change visualizer on x seconds
        visualizers: {
            classic: function (buffer, g, canvas) {

            },
            bars: function (buffer, g, canvas) {
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
            blueDream: function (buffer, g, canvas) {
                var canvasWidth = canvas.width,
                    canvasHeight = canvas.height,
                    numBuckets = buffer.length,
                    buffer = audioClipEmpty(buffer),
                    origin = {x: canvasWidth / 2, y: canvasHeight / 2},
                    centerOffset = canvasHeight * 0.05,
                    innerOffset = canvasHeight * 0.02,
                    edgePadding = canvasHeight * 0.02,
                    maxRadius = (canvasHeight / 2) - (centerOffset + edgePadding),
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
            }
        }
    };
}(jQuery));