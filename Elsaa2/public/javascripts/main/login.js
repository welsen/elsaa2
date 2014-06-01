$(function () {
    var $localUsername = localStorage.username;
    var $localPassword = localStorage.password;
    var $localRemember = localStorage.remember;

    $('[role=form]').on({
        submit: function (e) {
            var $username = $('[data-access="username"]').val();
            var $password = CryptoJS.MD5($('[data-access="password"]').val()).toString(CryptoJS.enc.Hex);
            var $remember = $('[data-access="remember"]').is(':checked');

            if ($remember) {
                localStorage['username'] = $username;
                localStorage['password'] = $password;
                localStorage['remember'] = $remember;
            }
        }
    });

    if ($localUsername && $localPassword && $localRemember) {
        $('[data-access="remember"]').prop('checked', $localRemember);
        $('[role=form]').submit();
    }
});
