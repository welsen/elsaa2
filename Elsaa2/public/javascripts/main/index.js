$(function () {
    videojs("vplayer", {
        "height": "480",
        "width": "720"
    }, function () {
        var vplayer = this;
        var aspectRatio = 9 / 16;

        function resizeVideoJS() {
            var width = document.getElementById(vplayer.id()).parentElement.offsetWidth;
            vplayer.width(width).height(width * aspectRatio);
        }

        resizeVideoJS();
        window.onresize = resizeVideoJS;
    });
});
