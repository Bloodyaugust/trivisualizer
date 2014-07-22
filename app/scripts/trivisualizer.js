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

    function Visualizer(config) {
        var me = this,
            stage = new PIXI.Stage(0x000000),
            $canvas = config.canvas ? $(config.canvas)[0] : $('canvas')[0],
            renderer = PIXI.autoDetectRenderer($canvas.width, 540, $canvas),
            graphics = new PIXI.Graphics(renderer.view),
            frequencyBuffer = config.frequencyBuffer || [],
            activeVisualizer = config.activeVisualizer || 'bars';

        me.renderTarget = $canvas;

        stage.addChild(graphics);

        me.start = function () {
            setInterval(render, 16);
        };

        me.listen = function (buffer) {
            frequencyBuffer = buffer;
        };

        function render() {
            $.fn.trivisualizer.defaults.visualizers[activeVisualizer](frequencyBuffer, graphics, $canvas);
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
                    barBaseline = canvasHeight / 2,
                    barWidth = barRegion * .8,
                    barOffset = barRegion / 2,
                    barX;

                g.clear();
                g.lineStyle(barWidth, 0x33CC33, 1);
                for (var i = 0; i < buffer.length; i++) {
                    barX = barOffset + barRegion * i;
                    g.moveTo(barX, barBaseline);
                    g.lineTo(barX, barBaseline - buffer[i]);
                }
            }
        }
    };
}(jQuery));