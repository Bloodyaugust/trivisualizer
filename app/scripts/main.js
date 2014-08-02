(function ($) {
    var visualizer = $('canvas').trivisualizer({
        activeVisualizer: 'blueDream'
    });
    visualizer.start();

    SC.initialize({
        client_id: "6015fc7ae3911c0283de765d4d138291",
        redirect_uri: "http://0.0.0.0:9000/callback.html"
    });

    var user, playlists, favorites;

    $('.soundcloud').click(function () {
        SC.connect(function() {
          SC.get('/me', function(me) {
            user = me;
            $('.soundcloud').hide();
            $('.media-control-header .avatar').append('<img src="' + me['avatar_url'] + '" class="img-responsive">');
            $('.media-control-header .username').append('<h3>' + me.username + '</h3>');
        });
          SC.get('/me/playlists', function(userPlaylists) {
            playlists = userPlaylists;
        });
          SC.get('/me/favorites', function(userFavorites) {
            favorites = userFavorites;
            $.each(favorites, function (i, val) {
                var newTrack = $('<span class="col-lg-12">' + val.title + '</span>').appendTo('.media-control-playlist');

                newTrack.data('trackid', val.id);
                newTrack.click(function () {
                    SC.stream('/track/' + $(this).data()['trackid'], function (sound) {
                        var audio = $('.trivisualizer-audio');

                        audio.attr('src', sound.url.replace('track', 'tracks'));
                    });
                });
            });
        });
      });
    });
}(jQuery));