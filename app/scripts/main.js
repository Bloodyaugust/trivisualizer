$(function () {
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

    setInterval(animate);

    function animate () {
        stats.begin();

        graphics.clear();
        graphics.lineStyle(10, 0xFF0000, 1);
        for (var i = 0; i < 10000; i++) {
            graphics.moveTo(50,40);
            graphics.lineTo(Math.random() * 200 + 50, Math.random() * 40 + 40);
        }

        renderer.render(stage);

        stats.end();
    }
});