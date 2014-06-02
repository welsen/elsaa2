    /*
     * GET home page.
     */

var md5 = require('crypto-js/md5');
var log4js = require('log4js');
log4js.configure({
    appenders: [
        {
            type: 'console'
        },
        {
            type: 'file',
            filename: 'logs/server.log',
            category: 'server'
        }
    ]
});
var logger = log4js.getLogger('server');
var us = require('underscore');

var Main = (function () {
    function Main() { }
    Main.prototype.Index = function (req, res) {
        if (req.session.user) {
            // logger.debug(req.session.user);
            res.render('main/index', {
                title: 'ELSAA',
                page: 'main/index'
            });
        } else {
            res.redirect('/login');
        }
    };

    Main.prototype.Login = function (req, res) {
        res.render('main/login', {
            title: 'ELSAA Login',
            page: 'main/login',
            locale: {
                'signInHeading': 'Please sign in',
                'username': 'Username',
                'password': 'Password',
                'rememberMe': 'Remember me',
                'loginHelp': 'For admin login click <a href="/admin">here</a>',
                'signIn': 'Sign in'
            }
        });
    };

    Main.prototype.LoginAuthenticate = function (req, res) {
        var username = req.body.username;
        var password = md5(req.body.password).toString();
        // logger.debug(password);
        global.acl.Authenticate(username, password, function (result) {
            if (result !== false) {
                req.session.user = result;
                res.redirect('/');
            } else {
                res.redirect('/login');
            }
        });
    };

    Main.prototype.Logout = function (req, res) {
        if (req.session.user) {
            delete req.session.user;
        }
        res.redirect('/login');
    };

    return Main;
})();

var Admin = (function () {
    function Admin() { }
    Admin.prototype.Index = function (req, res) {
        if (req.session.adminuser) {
            // logger.debug(req.session.user);
            res.render('admin/index', {
                title: 'ELSAA Admin',
                page: 'admin/index',
                permissions: req.session.adminuser.permissions,
                perms: req.session.adminuser.perms,
                subpage: 'dashboard'
            });
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.Login = function (req, res) {
        res.render('admin/login', {
            title: 'ELSAA Login',
            page: 'admin/login',
            locale: {
                'signInHeading': 'Please sign in',
                'username': 'Username',
                'password': 'Password',
                'rememberMe': 'Remember me',
                'signIn': 'Sign in'
            }
        });
    };

    Admin.prototype.LoginAuthenticate = function (req, res) {
        var username = req.body.username;
        var password = md5(req.body.password).toString();
        global.acl.Authenticate(username, password, function (result) {
            if (result !== false) {
                req.session.adminuser = result;
                // logger.debug(req.session.adminuser);
                if (req.session.adminuser.perms['Admin Access']) {
                    req.session.user = us.clone(req.session.adminuser);
                    res.redirect('/admin');
                } else {
                    req.session.user = us.clone(req.session.adminuser);
                    delete req.session.adminuser;
                    res.redirect('/');
                }
            } else {
                res.redirect('/admin/login');
            }
        });
    };

    Admin.prototype.Logout = function (req, res) {
        if (req.session.adminuser) {
            delete req.session.adminuser;
        }
        if (req.session.user) {
            delete req.session.user;
        }
        res.redirect('/login');
    };

    Admin.prototype.Permissions = function (req, res) {
        if (req.session.adminuser) {
            global.acl.GetPermissions(function (permissionList) {
                res.render('admin/permissions', {
                    title: 'ELSAA Admin [Permissions]',
                    page: 'admin/permissions',
                    permissions: req.session.adminuser.permissions,
                    perms: req.session.adminuser.perms,
                    permissionList: permissionList,
                    subpage: 'permissions'
                });
            });
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.AllPermissions = function (req, res) {
        if (req.session.adminuser) {
            global.acl.GetPermissions(function (permissionList) {
                res.json(permissionList);
            });
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.AddPermissions = function (req, res) {
        if (req.session.adminuser) {
            if (req.session.adminuser.perms['Add Permission']) {
                var parent = req.body.parent;
                var name = req.body.name;
                var description = req.body.description;
                var deletable = req.body.deletable;
                global.acl.AddPermission(name, description, parent, deletable, function () {
                    res.json(true);
                });
            } else {
                res.json(false);
            }
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.DeletePermissions = function (req, res) {
        if (req.session.adminuser) {
            if (req.session.adminuser.perms['Delete Permission']) {
                var id = req.body.id;
                global.acl.DeletePermission(id, function () {
                    res.json(true);
                });
            } else {
                res.json(false);
            }
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.EditPermissions = function (req, res) {
        if (req.session.adminuser) {
            if (req.session.adminuser.perms['Modify Permission']) {
                var id = req.body.id;
                var desc = req.body.description;
                global.acl.UpdatePermission(id, desc, function () {
                    res.json(true);
                });
            } else {
                res.json(false);
            }
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.Roles = function (req, res) {
        if (req.session.adminuser) {
            global.acl.GetRoles(function (roleList) {
                res.render('admin/roles', {
                    title: 'ELSAA Admin [Roles]',
                    page: 'admin/roles',
                    roles: req.session.adminuser.roles,
                    perms: req.session.adminuser.perms,
                    roleList: roleList,
                    subpage: 'roles'
                });
            });
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.AllRoles = function (req, res) {
        if (req.session.adminuser) {
            global.acl.GetRoles(function (roleList) {
                res.json(roleList);
            });
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.AddRoles = function (req, res) {
        if (req.session.adminuser) {
            if (req.session.adminuser.perms['Add Role']) {
                var parent = req.body.parent;
                var name = req.body.name;
                var description = req.body.description;
                var deletable = req.body.deletable;
                global.acl.AddRole(name, description, parent, deletable, function () {
                    res.json(true);
                });
            } else {
                res.json(false);
            }
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.DeleteRoles = function (req, res) {
        if (req.session.adminuser) {
            if (req.session.adminuser.perms['Delete Role']) {
                var id = req.body.id;
                global.acl.DeleteRole(id, function () {
                    res.json(true);
                });
            } else {
                res.json(false);
            }
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.EditRoles = function (req, res) {
        if (req.session.adminuser) {
            if (req.session.adminuser.perms['Modify Role']) {
                var id = req.body.id;
                var desc = req.body.description;
                global.acl.UpdateRole(id, desc, function () {
                    res.json(true);
                });
            } else {
                res.json(false);
            }
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.GetRolePermissions = function(req, res) {
        if (req.session.adminuser) {
            if (req.session.adminuser.perms['Modify Role']) {
                var id = req.body.roleId;
                global.acl.GetRolePermissions(id, function(data) {
                    res.json(data);
                });
            } else {
                res.json(false);
            }
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.SetRolePermissions = function(req, res) {
        if (req.session.adminuser) {
            if (req.session.adminuser.perms['Modify Role']) {
                var roleId = req.body.roleId;
                var permissionId = req.body.permissionId;
                var link = req.body.link;
                if (link) {
                    global.acl.LinkPermissionRole(permissionId, roleId, function() {
                        res.json(true);
                    });
                } else {
                    global.acl.UnLinkPermissionRole(permissionId, roleId, function() {
                        res.json(true);
                    });
                }
            } else {
                res.json(false);
            }
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.Users = function (req, res) {
        if (req.session.adminuser) {
            global.acl.GetUsers(function (userList) {
                res.render('admin/users', {
                    title: 'ELSAA Admin [Users]',
                    page: 'admin/users',
                    users: req.session.adminuser.permissions,
                    perms: req.session.adminuser.perms,
                    userList: userList,
                    subpage: 'users'
                });
            });
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.AllUsers = function (req, res) {
        if (req.session.adminuser) {
            global.acl.GetUsers(function (userList) {
                res.json(userList);
            });
        } else {
            res.redirect('/admin/login');
        }
    };

    Admin.prototype.AddUsers = function (req, res) {
        if (req.session.adminuser) {
            if (req.session.adminuser.perms['Add User']) {
                var username = req.body.username;
                var password = req.body.password;
                var fullname = req.body.fullname;
                var email = req.body.email;
                global.acl.AddLocalUser(username, password, fullname, email, function () {
                    res.json(true);
                });
            } else {
                res.json(false);
            }
        } else {
            res.redirect('/admin/login');
        }
    };

    return Admin;
})();

exports.main = new Main();
exports.admin = new Admin();
