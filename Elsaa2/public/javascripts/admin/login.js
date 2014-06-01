$(function () {
    var $localAdmiUsername = localStorage.adminusername;
    var $localAdminPassword = localStorage.adminpassword;
    var $localAdminRemember = localStorage.adminremember;

    $('[role=form]').on({
        submit: function (e) {
            var $username = $('[data-access="username"]').val();
            var $password = CryptoJS.MD5($('[data-access="password"]').val()).toString(CryptoJS.enc.Hex);
            var $remember = $('[data-access="remember"]').is(':checked');

            if ($remember) {
                localStorage['adminusername'] = $username;
                localStorage['adminpassword'] = $password;
                localStorage['adminremember'] = $remember;
            }
        }
    });

    if ($localAdmiUsername && $localAdminPassword && $localAdminRemember) {
        $('[data-access="remember"]').prop('checked', $localAdminRemember);
        $('[role=form]').submit();
    }
});
