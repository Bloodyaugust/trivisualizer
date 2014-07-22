(function ($) {

    var stats = new Stats();
    stats.setMode(1); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    $('body').append(stats.domElement);

    var visualizer = $('canvas').trivisualizer({
        frequencyBuffer: [100, 20, 33, 200]
    });
    visualizer.start();
}(jQuery));