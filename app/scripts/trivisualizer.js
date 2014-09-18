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

    function vec2(x, y) {
        this.x = x;
        this.y = y;
        this.pName = 'vec2';
    }

    vec2.prototype.translate = function (translateBy) {
        this.x += translateBy.x;
        this.y += translateBy.y;
    }

    vec2.prototype.normalize = function () {
        var mag = this.magnitude();
        this.x /= mag;
        this.y /= mag;
    }

    vec2.prototype.getNormal = function () {
        var mag = this.magnitude();
        return new vec2(this.x / mag, this.y / mag);
    }

    vec2.prototype.scale = function (scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    vec2.prototype.getScaled = function (scalar) {
        return new vec2(this.x * scalar, this.y * scalar);
    }

    vec2.prototype.translateAlongRotation = function (translateBy, rotation) {
        var dX = translateBy * Math.cos(rotation * Math.PI / 180);
        var dY = translateBy * Math.sin(rotation * Math.PI / 180);
        this.x += dX;
        this.y += dY;
    }

    vec2.prototype.getRotated = function (origin, angle) {
        var cos = Math.cos(angle * 0.0174532925);
        var sin = Math.sin(angle * 0.0174532925);

        var newX = this.x - origin.x;
        var newY = this.y - origin.y;

        var rotatedX = newX * cos - newY * sin;
        var rotatedY = newX * sin + newY * cos;

        var finalX = rotatedX + origin.x;
        var finalY = rotatedY + origin.y;

        return new vec2(finalX, finalY);
    }

    vec2.prototype.getTranslated = function (translateBy) {
        var x = translateBy.x + this.x;
        var y = translateBy.y + this.y;
        return new vec2(x, y);
    }

    vec2.prototype.getTranslatedAlongRotation = function (translateBy, rotation) {
        var dX = translateBy * Math.cos(rotation * Math.PI / 180);
        var dY = translateBy * Math.sin(rotation * Math.PI / 180);
        var x = dX + this.x;
        var y = dY + this.y;
        return new vec2(x, y);
    }

    vec2.prototype.distance = function (p2) {
        return Math.sqrt(((p2.x - this.x) * (p2.x - this.x)) + ((p2.y - this.y) * (p2.y - this.y)));
    }

    vec2.prototype.equals = function (p2) {
        if (this.x === p2.x && this.y === p2.y)
            return true;
        return false;
    }

    vec2.prototype.magnitude = function () {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

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
            totalChange = 0,
            i, i2, bufferTotal, averageChange;

        for (i = 0; i < bufferFrames.length; i++) {
            bufferTotal = 0;
            for (i2 = 0; i2 < bufferFrames[i].length; i2++) {
                bufferTotal += bufferFrames[i][i2];
            }

            averages.push(bufferTotal / bufferFrames[i].length);
        }

        for (i = 0; i < averages.length; i++) {
            averageChanges.push(averages[i]);
        }

        for (i = 0; i < averageChanges.length; i++) {
            totalChange += averageChanges[i];
        }

        averageChange = totalChange / averageChanges.length;
        return averageChange;
    }

    function Visualizer(config) {
        var me = this,
        i;

        me.name = config.name;
        me.fftSize = config.fftSize;
        me.filters = config.filters;

        for (i in config) {
            if (config.hasOwnProperty(i)) {
                me[i] = config[i];
            }
        }

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
            audioContext = new (AudioContext || window.webkitAudioContext)(),
            audioSource = audioContext.createMediaElementSource($('.trivisualizer-audio')[0]),
            audioAnalyser = audioContext.createAnalyser(),
            visualizers = [],
            activeVisualizer, activeVisualizerIndex, i;

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
                    activeVisualizerIndex = i;
                    break;
                }
            }

            audioAnalyser.fftSize = activeVisualizer.fftSize;
            $canvas.css('-webkit-filter', activeVisualizer.filters);
        };

        me.nextVisualizer = function () {
            if (activeVisualizerIndex + 1 < visualizers.length) {
                me.setVisualizer(visualizers[activeVisualizerIndex + 1].name);
            } else {
                me.setVisualizer(visualizers[0].name);
            }
        }

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
                    var me = this,
                        canvasWidth = canvas.width,
                        canvasHeight = canvas.height,
                        numBuckets = buffer.length,
                        barRegion = (canvasWidth / numBuckets),
                        barBaseline = canvasHeight * .7,
                        barWidth = barRegion * .8,
                        barOffset = barRegion / 2,
                        barX;

                    me.bufferFrames.unshift(buffer);
                    me.bufferFrames.length > 16 ? me.bufferFrames.pop() : null;

                    g.clear();
                    g.lineStyle(barWidth, 0xFF6600, 1);
                    for (var i = 0; i < buffer.length; i++) {
                        barX = barOffset + barRegion * i;
                        g.moveTo(barX, barBaseline);
                        g.lineTo(barX, barBaseline - buffer[i]);
                    }
                    g.lineStyle(barWidth, 0x00FF00, 0.8);
                    for (var i = 0; i < buffer.length; i++) {
                        barX = barOffset + barRegion * i;
                        g.moveTo(barX, barBaseline - buffer[i]);
                        g.lineTo(barX, barBaseline - buffer[i] - (buffer[i] * .1));
                    }
                    g.lineStyle(barWidth, 0xB24700, 0.3);
                    for (i = 0; i < buffer.length; i++) {
                        barX = barOffset + barRegion * i;
                        g.moveTo(barX, barBaseline + 20);
                        g.lineTo(barX, barBaseline + 20 + buffer[i] / 2);
                    }

                    $('canvas').css('-webkit-filter', 'saturate(' + (100 + (audioDetectBeat(me.bufferFrames, 1)).toFixed() * 2) + '%) ' + 'hue-rotate(' + (audioDetectBeat(me.bufferFrames, 1).toFixed() * 2) + 'deg)');
                },
                fftSize: 256,
                filters: '',
                name: 'bars',
                bufferFrames: []
            },
            {
                render: function (buffer, g, canvas) {
                    var me = this,
                        canvasWidth = canvas.width,
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

                    me.bufferFrames.unshift(buffer);
                    me.bufferFrames.length > 16 ? me.bufferFrames.pop() : null;

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

                    $('canvas').css('-webkit-filter', 'hue-rotate(' + (audioDetectBeat(me.bufferFrames, 1).toFixed() * 2) + 'deg)');
                },
                fftSize: 2048,
                filters: '',
                name: 'blueDream',
                bufferFrames: []
            },
            {
                render: function (buffer, g, canvas) {
                    var me = this,
                        canvasWidth = canvas.width,
                        canvasHeight = canvas.height,
                        buffer = audioClipEmpty(buffer),
                        numBuckets = buffer.length,
                        origin = {x: canvasWidth / 2, y: canvasHeight / 2},
                        barWidth = 2,
                        barLength = 80,
                        bufferModulo, lastEndpoint, barForce, actualLength;

                    me.bufferFrames.unshift(buffer);
                    me.bufferFrames.length > 16 ? me.bufferFrames.pop() : null;

                    g.clear();
                    g.lineStyle(barWidth, 0x0099FF, 0.35);
                    g.moveTo(origin.x, origin.y);
                    lastEndpoint = {x: origin.x, y: origin.y};
                    for (var i = 0; i < buffer.length; i++) {
                        bufferModulo = buffer[i] % 5;
                        barForce = buffer[i] / 255;
                        actualLength = barLength * barForce;

                        if (buffer[i] !== 0 &&bufferModulo < 1) {
                            g.moveTo(origin.x, origin.y);
                            g.lineTo(origin.x + (actualLength / 2), origin.y - (actualLength / 2));
                            lastEndpoint = {x: origin.x + (actualLength / 2), y: origin.y - (actualLength / 2)};
                        } else if (bufferModulo >= 1 && bufferModulo < 2) {
                            g.lineTo(lastEndpoint.x - (actualLength / 2), lastEndpoint.y - (actualLength / 2));
                            lastEndpoint = {x: lastEndpoint.x - (actualLength / 2), y: lastEndpoint.y - (actualLength / 2)};
                        } else if (bufferModulo >= 2 && bufferModulo < 3) {
                            g.lineTo(lastEndpoint.x + (actualLength / 2), lastEndpoint.y - (actualLength / 2));
                            lastEndpoint = {x: lastEndpoint.x + (actualLength / 2), y: lastEndpoint.y - (actualLength / 2)};
                        } else if (bufferModulo >= 3 && bufferModulo < 4) {
                            g.lineTo(lastEndpoint.x - (actualLength / 2), lastEndpoint.y + (actualLength / 2));
                            lastEndpoint = {x: lastEndpoint.x - (actualLength / 2), y: lastEndpoint.y + (actualLength / 2)};
                        } else if (bufferModulo >= 4) {
                            g.lineTo(lastEndpoint.x + (actualLength / 2), lastEndpoint.y + (actualLength / 2));
                            lastEndpoint = {x: lastEndpoint.x + (actualLength / 2), y: lastEndpoint.y + (actualLength / 2)};
                        }
                    }

                    $('canvas').css('-webkit-filter', 'hue-rotate(' + (audioDetectBeat(me.bufferFrames, 1).toFixed() * 2) + 'deg)');
                },
                fftSize: 2048,
                filters: '',
                name: 'fractality',
                bufferFrames: []
            },
            {
                render: function (buffer, g, canvas) {
                    var me = this,
                        canvasWidth = canvas.width,
                        canvasHeight = canvas.height,
                        buffer = audioClipEmpty(buffer),
                        numBuckets = buffer.length,
                        origin = new vec2(canvasWidth / 2, canvasHeight / 2),
                        barWidth = 4,
                        barLength = 300,
                        bufferModulo, lastEndpoint, barForce, actualLength;

                    me.bufferFrames.unshift(buffer);
                    me.bufferFrames.length > 16 ? me.bufferFrames.pop() : null;

                    g.clear();
                    g.lineStyle(barWidth, 0x0099FF, 0.35);
                    g.moveTo(origin.x, origin.y);
                    lastEndpoint = new vec2(origin.x, origin.y);
                    for (var i = 0; i < buffer.length; i++) {
                        bufferModulo = buffer[i] % 6;
                        barForce = buffer[i] / 255;
                        actualLength = barLength * barForce;

                        if (buffer[i] !== 0 && bufferModulo < 1) {
                            lastEndpoint = origin.getTranslatedAlongRotation(actualLength, 30);
                            g.moveTo(origin.x, origin.y);
                        } else if (bufferModulo >= 1 && bufferModulo < 2) {
                            lastEndpoint = origin.getTranslatedAlongRotation(actualLength, 90);
                        } else if (bufferModulo >= 2 && bufferModulo < 3) {
                            lastEndpoint = origin.getTranslatedAlongRotation(actualLength, 150);
                        } else if (bufferModulo >= 3 && bufferModulo < 4) {
                            lastEndpoint = origin.getTranslatedAlongRotation(actualLength, 210);
                        } else if (bufferModulo >= 4 && bufferModulo < 5) {
                            lastEndpoint = origin.getTranslatedAlongRotation(actualLength, 270);
                        } else if (bufferModulo >= 5) {
                            lastEndpoint = origin.getTranslatedAlongRotation(actualLength, 330);
                        }

                        g.lineTo(lastEndpoint.x, lastEndpoint.y);
                    }

                    $('canvas').css('-webkit-filter', 'hue-rotate(' + (audioDetectBeat(me.bufferFrames, 1).toFixed() * 4) + 'deg)');
                },
                fftSize: 2048,
                filters: '',
                name: 'davidSees',
                bufferFrames: []
            },/**
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
            }**/]
        };
}(jQuery));