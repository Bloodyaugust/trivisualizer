(function ($) {
    var stage = new PIXI.Stage(0x000000),
        $canvas = $('canvas')[0],
        renderer = PIXI.autoDetectRenderer($canvas.width, 540, $canvas),
        graphics = new PIXI.Graphics(renderer.view);

    var stats = new Stats();
    stats.setMode(1); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    $('body').append(stats.domElement);

    graphics.lineStyle(10, 0xFF0000, 1);

    stage.addChild(graphics);

    function Visualizer (config) {
        var me = this;

        me.renderTarget = config.renderTarget || $('canvas')[0];
        me.frequencyBuffer = config.frequencyBuffer || [];

        me.render = function () {
            config.render ? config.render() : null;
        };

        me.begin = function () {
            setInterval(me.render, 16)
        };
    }
}(jQuery));