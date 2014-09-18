(function ($) {
    var visualizer = $('canvas').trivisualizer({
        defaultVisualizer: 'davidSees'
    });
    visualizer.start();

    SC.initialize({
        client_id: "6015fc7ae3911c0283de765d4d138291",
        redirect_uri: "http://0.0.0.0:9000/callback.html"
    });

    var playlists = {},
        activePlaylist, activeSong;

    $('canvas').mouseenter(function () {
        $('.full-screen').clearQueue().fadeIn();
    });
    $('canvas').mouseleave(function () {
        $('.full-screen').delay(1).fadeOut();
    });
    $('.full-screen').mouseenter(function () {
        $('.full-screen').clearQueue().fadeIn();
    });
    $('.full-screen').mouseleave(function () {
        $('.full-screen').delay(1).fadeOut();
    });
    $('.full-screen').click(function () {
        $('canvas')[0].webkitRequestFullScreen();
    });

    $('.game').css('max-height', $('.game').height());

    $('.trivisualizer-audio').on('canplay', function () {
        $(this).trigger('play');
    });
    $('.trivisualizer-audio').on('ended', function () {
        setActiveSong(activeSong + 1);
    });

    SC.get('/playlists/51466303', function (playlist) {
        playlists['trivisualizer'] = {
            tracks: playlist.tracks,
            title: 'Trivisualizer'
        };
        setPlaylist('trivisualizer');
        setActiveSong(1);
    });

    $('.soundcloud').click(function () {
        SC.connect(function() {
          SC.get('/me', function(me) {
            user = me;
            $('.soundcloud').hide();
            $('.media-control-header .avatar').append('<img src="' + me['avatar_url'] + '" class="img-responsive">');
            $('.media-control-header .username').append('<h3>' + me.username + '</h3>');
        });
          SC.get('/me/playlists', function(userPlaylists) {
            for (var i = 0; i < userPlaylists.length; i++) {
                playlists[userPlaylists[i].permalink] = userPlaylists[i];
                $('select').append('<option value="' + userPlaylists[i].permalink + '">' + userPlaylists[i].title + '</option>');
            }
        });
          SC.get('/me/favorites', function(favorites) {
            playlists['favorites'] = {
                tracks: favorites,
                title: 'Favorites'
            };

            $('select').append('<option value="favorites">Favorites</option>');
        });
      });
    });

    $('select').change(function() {
        setPlaylist($(this).val());
    });

    $(document).keyup(function (e) {
        if (e.which === 39) {
            visualizer.nextVisualizer();
        }
    });

    function setPlaylist(key) {
        var playlist = playlists[key],
            $playlist = $('.media-control-playlist');

        $playlist.empty();

        $.each(playlist.tracks, function (i, val) {
            var newTrack = $('<span class="col-lg-12">' + val.title + ' - ' + val.user.username + '</span>').appendTo($playlist);

            newTrack.data('trackid', val.id);
            newTrack.click(function () {
                setActiveSong(i + 1);
            });
        });
    }

    function setActiveSong(index) {
        var $media = $('.trivisualizer-audio'),
            $playlist = $('.media-control-playlist'),
            $active = $(':nth-child(' + index + ')', $playlist);

        $playlist.children().removeClass('active');
        $active.addClass('active');

        SC.stream('/track/' + $active.data()['trackid'], function (sound) {
            $media.attr('src', sound.url.replace('track', 'tracks'));
        });

        activeSong = index;
    }
}(jQuery));