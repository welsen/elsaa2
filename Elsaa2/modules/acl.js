var md5 = require("crypto-js/md5");
var logger = global.log4js.getLogger('elsaa');
var us = require('underscore');
var acl = require('acl');

var Acl = (function () {
    'use strict';

    function Acl(db) {
        this.DB = db;
        this.ACL = new acl(new acl.mongodbBackend(this.DB, "acl_"));
        this.Auth = {};
        this.__ROLE = {};
        var self = this;
    }

    Acl.prototype.AddRole = function (name, desc, parent, deletable, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("INSERT INTO ACL_ROLES(NAME, DESCRIPTION, PARENT, CREATED, MODIFIED, DELETABLE, ACTIVE) VALUES(:name, :desc, :parent, :now, :now, :deletable, 1)", {
            ':name': name,
            ':desc': desc,
            ':parent': parent,
            ':deletable': deletable,
            ':now': now
        }, function (error) {
            if (error == null) {
                callback();
            } else {
                self.DB.run("UPDATE ACL_ROLES SET DESCRIPTION=:desc, MODIFIED=:now, DELETABLE=:deletable, PARENT=:parent, ACTIVE=1 WHERE NAME=:name", {
                    ':name': name,
                    ':desc': desc,
                    ':parent': parent,
                    ':deletable': deletable,
                    ':now': now
                }, function (error) {
                    if (error == null) {
                        callback();
                    } else {
                        logger.error(error);
                    }
                });
            }
        });
    };

    Acl.prototype.UpdateRole = function (id, desc, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("UPDATE ACL_ROLES SET DESCRIPTION=:desc, MODIFIED=:now WHERE ID=:id", {
            ':id': id,
            ':desc': desc,
            ':now': now
        }, function (error) {
            if (error == null) {
                callback();
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.DeleteRole = function (id, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("UPDATE ACL_ROLES SET ACTIVE=0, MODIFIED=:now WHERE ID=:id AND DELETABLE=1", {
            ':id': id,
            ':now': now
        }, function (error) {
            if (error == null) {
                if (this.changes != 0) {
                    self.DB.run("UPDATE ACL_ROLES SET PARENT=0, MODIFIED=:now WHERE PARENT=:id", {
                        ':id': id,
                        ':now': now
                    }, function (error) {
                        if (error == null) {
                            callback();
                        } else {
                            logger.error(error);
                        }
                    });
                }
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.GetRolesUnder = function (id, callback) {
        var self = this;

        self.DB.all("WITH RECURSIVE\
                UNDER_ROLE(NAME,LEVEL,DESCRIPTION,ID, PARENT) AS (\
                    SELECT ACL_ROLES.NAME, 0 AS LEVEL, ACL_ROLES.DESCRIPTION, ACL_ROLES.ID, ACL_ROLES.PARENT\
                        FROM ACL_ROLES\
                        WHERE ACL_ROLES.ID = :id\
                    UNION ALL\
                    SELECT ACL_ROLES.NAME, UNDER_ROLE.LEVEL + 1, ACL_ROLES.DESCRIPTION, ACL_ROLES.ID, ACL_ROLES.PARENT\
                        FROM ACL_ROLES JOIN UNDER_ROLE ON ACL_ROLES.PARENT=UNDER_ROLE.ID\
                        WHERE ACL_ROLES.ACTIVE = 1\
                        ORDER BY 2 DESC\
                )\
            SELECT ID, NAME, PARENT, DESCRIPTION FROM UNDER_ROLE;", {
            ':id': id
        }, function (error, rows) {
            if (error == null) {
                callback(rows);
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.GetRootPermissionsForRoles = function (id, callback) {
        var self = this;

        self.DB.all("WITH RECURSIVE\
                UNDER_ROLE(NAME,LEVEL,DESCRIPTION,ID, PARENT) AS (\
                    SELECT ACL_ROLES.NAME, 0 AS LEVEL, ACL_ROLES.DESCRIPTION, ACL_ROLES.ID, ACL_ROLES.PARENT\
                        FROM ACL_ROLES\
                        WHERE ACL_ROLES.ID = :id\
                    UNION ALL\
                    SELECT ACL_ROLES.NAME, UNDER_ROLE.LEVEL + 1, ACL_ROLES.DESCRIPTION, ACL_ROLES.ID, ACL_ROLES.PARENT\
                        FROM ACL_ROLES JOIN UNDER_ROLE ON ACL_ROLES.PARENT=UNDER_ROLE.ID\
                        WHERE ACL_ROLES.ACTIVE = 1\
                        ORDER BY 2 DESC\
                )\
            SELECT DISTINCT ACL_PERMISSIONS.*\
                FROM UNDER_ROLE\
                JOIN ACL_ROLEPERMISSIONS ON UNDER_ROLE.ID = ACL_ROLEPERMISSIONS.ROLEID\
                JOIN ACL_PERMISSIONS ON ACL_ROLEPERMISSIONS.PERMISSIONID = ACL_PERMISSIONS.ID;", {
            ':id': id
        }, function (error, rows) {
            if (error == null) {
                callback(rows);
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.GetRoles = function (callback) {
        var self = this;

        self.DB.all("SELECT * FROM V_UNDER_ROLE;", function (error, rows) {
            if (error == null) {
                callback(rows);
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.AddPermission = function (name, desc, parent, deletable, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("INSERT INTO ACL_PERMISSIONS(NAME, DESCRIPTION, PARENT, CREATED, MODIFIED, DELETABLE, ACTIVE) VALUES(:name, :desc, :parent, :now, :now, :deletable, 1)", {
            ':name': name,
            ':desc': desc,
            ':parent': parent,
            ':deletable': deletable,
            ':now': now
        }, function (error) {
            if (error == null) {
                callback();
            } else {
                self.DB.run("UPDATE ACL_PERMISSIONS SET DESCRIPTION=:desc, MODIFIED=:now, DELETABLE=:deletable, PARENT=:parent, ACTIVE=1 WHERE NAME=:name", {
                    ':name': name,
                    ':desc': desc,
                    ':parent': parent,
                    ':deletable': deletable,
                    ':now': now
                }, function (error) {
                    if (error == null) {
                        callback();
                    } else {
                        logger.error(error);
                    }
                });
            }
        });
    };

    Acl.prototype.UpdatePermission = function (id, desc, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("UPDATE ACL_PERMISSIONS SET DESCRIPTION=:desc, MODIFIED=:now WHERE ID=:id", {
            ':id': id,
            ':desc': desc,
            ':now': now
        }, function (error) {
            if (error == null) {
                callback();
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.DeletePermission = function (id, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("UPDATE ACL_PERMISSIONS SET ACTIVE=0, MODIFIED=:now WHERE ID=:id AND DELETABLE=1", {
            ':id': id,
            ':now': now
        }, function (error) {
            if (error == null) {
                if (this.changes != 0) {
                    self.DB.run("UPDATE ACL_PERMISSIONS SET PARENT=0, MODIFIED=:now WHERE PARENT=:id", {
                        ':id': id,
                        ':now': now
                    }, function (error) {
                        if (error == null) {
                            callback();
                        } else {
                            logger.error(error);
                        }
                    });
                }
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.GetPermissionsUnder = function (permission, callback) {
        var self = this;

        self.DB.all("WITH RECURSIVE\
                        UNDER_PERMISSION(NAME,LEVEL,DESCRIPTION,ID,PARENT,ACTIVE,DELETABLE) AS (\
                            SELECT :name AS NAME, 0 AS LEVEL, :desc AS DESCRIPTION, :id AS ID, :parent AS PARENT, :active AS ACTIVE, :deletable AS DELETABLE\
                            UNION ALL\
                            SELECT ACL_PERMISSIONS.NAME, UNDER_PERMISSION.LEVEL + 1, ACL_PERMISSIONS.DESCRIPTION, ACL_PERMISSIONS.ID, ACL_PERMISSIONS.PARENT, ACL_PERMISSIONS.ACTIVE, ACL_PERMISSIONS.DELETABLE\
                                FROM ACL_PERMISSIONS JOIN UNDER_PERMISSION ON ACL_PERMISSIONS.PARENT=UNDER_PERMISSION.ID\
                                WHERE ACL_PERMISSIONS.ACTIVE = 1\
                                ORDER BY 2 DESC\
                        )\
                    SELECT ID, NAME, LEVEL, DESCRIPTION, PARENT, DELETABLE, ACTIVE FROM UNDER_PERMISSION;", {
            ':id': permission.ID,
            ':name': permission.NAME,
            ':desc': permission.DESCRIPTION,
            ':parent': permission.PARENT,
            ':deletable': permission.DELETABLE,
            ':active': permission.ACTIVE
        }, function (error, rows) {
            if (error == null) {
                callback(rows);
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.GetPermissions = function (callback) {
        var self = this;

        self.DB.all("SELECT * FROM V_UNDER_PERMISSION;", function (error, rows) {
            if (error == null) {
                callback(rows);
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.LinkPermissionRole = function (permissionId, roleId, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("UPDATE ACL_ROLEPERMISSIONS SET ACTIVE=1, MODIFIED=:now WHERE ROLEID=:rid AND PERMISSIONID=:pid", {
            ':now': now,
            ':rid': roleId,
            ':pid': permissionId
        }, function (error) {
            if (error == null) {
                if (this.changes != 0) {
                    callback();
                } else {
                    self.DB.run("INSERT INTO ACL_ROLEPERMISSIONS(ROLEID, PERMISSIONID, CREATED, MODIFIED, ACTIVE) VALUES(:rid, :pid, :now, :now, 1)", {
                        ':now': now,
                        ':rid': roleId,
                        ':pid': permissionId
                    }, function (error) {
                        if (error == null) {
                            callback();
                        } else {
                            logger.error(error);
                        }
                    });
                }
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.UnLinkPermissionRole = function (permissionId, roleId, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("DELETE FROM ACL_ROLEPERMISSIONS WHERE ROLEID=:rid AND PERMISSIONID=:pid", {
            ':rid': roleId,
            ':pid': permissionId
        }, function (error) {
            if (error == null) {
                callback();
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.GetRolePermissions = function (roleId, callback) {
        var self = this;
        self.GetRootPermissionsForRoles(roleId, function (rows) {
            var token = (new Date()).getTime();
            self.__ROLE[token] = {
                'permissions': []
            };
            self.__ROLE[token].rolecount = rows.length;
            self.__ROLE[token].c = 0;
            for (var idx in rows) {
                var permission = rows[idx];
                self.GetPermissionsUnder(permission, function (data) {
                    data.forEach(function (perm) {
                        var exists = us.findWhere(self.__ROLE[token].permissions, perm) != undefined;
                        if (!exists) {
                            self.__ROLE[token].permissions.push(perm);
                        }
                    });
                    self.__ROLE[token].c++;
                    // debugger;
                    if (self.IsGetRolePermissionReady(self.__ROLE[token].c, token)) {
                        self.OnGetRolePermissionDone(token, callback);
                    }
                });
            };
            if (self.IsGetRolePermissionReady(self.__ROLE[token].c, token)) {
                self.OnGetRolePermissionDone(token, callback);
            }
        });
    };

    Acl.prototype.IsGetRolePermissionReady = function (c, token) {
        var self = this;
        return c == self.__ROLE[token].rolecount;
    };

    Acl.prototype.OnGetRolePermissionDone = function (token, callback) {
        var self = this;
        callback(self.__ROLE[token].permissions);
        delete self.__ROLE[token];
    };

    Acl.prototype.AssignUserRole = function (userId, roleId, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("UPDATE ACL_USERROLES SET ACTIVE=1, MODIFIED=:now WHERE ROLEID=:rid AND USERID=:uid", {
            ':now': now,
            ':rid': roleId,
            ':uid': userId
        }, function (error) {
            if (error == null && this.changes != 0) {
                debugger;
                callback();
            } else {
                self.DB.run("INSERT INTO ACL_USERROLES(USERID, ROLEID, CREATED, MODIFIED, ACTIVE) VALUES(:uid, :rid, :now, :now, 1)", {
                    ':now': now,
                    ':rid': roleId,
                    ':uid': userId
                }, function (error) {
                    debugger;
                    if (error == null) {
                        callback();
                    } else {
                        logger.error(error);
                    }
                });
            }
        });
    };

    Acl.prototype.UnAssignUserRole = function (userId, roleId, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("UPDATE ACL_USERROLES SET ACTIVE=0, MODIFIED=:now WHERE ROLEID=:rid AND USERID=:uid", {
            ':now': now,
            ':rid': roleId,
            ':uid': userId
        }, function (error) {
            if (error == null) {
                callback();
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.AddLocalUser = function (username, password, fullname, email, callback) {
        var self = this;
        self.AddUser(username, password, fullname, email, 'local', callback);
    };

    Acl.prototype.AddLDAPUser = function (username, password, fullname, email, callback) {
        var self = this;
        self.AddUser(username, password, fullname, email, 'ldap', callback);
    };

    Acl.prototype.AddUser = function (username, password, fullname, email, type, callback) {
        var self = this;
        var now = (new Date()).getTime();

        self.DB.run("INSERT INTO ACL_USERS(USERNAME, PASSWORD, EMAIL, FULLNAME, TYPE, CREATED, MODIFIED, ACTIVE) VALUES(:username, :password, :email, :fullname, :type, :cnow, :mnow, 1)", {
            ':username': username,
            ':password': md5(password).toString(),
            ':email': email,
            ':fullname': fullname,
            ':type': type,
            ':cnow': now,
            ':mnow': now
        }, function (error) {
            if (error == null) {
                self.AssignUserRole(this.lastID, 5, callback);
            } else {
                logger.error(error);
            }
        });
    };

    Acl.prototype.GetUsers = function (callback) {
        var self = this;

        self.DB.all("SELECT ID, USERNAME, FULLNAME, EMAIL, TYPE, ACTIVE FROM ACL_USERS;", function (error, rows) {
            if (error == null) {
                callback(rows);
            } else {
                logger.error(error);
            }
        });
    }

    Acl.prototype.Authenticate = function (username, password, callback) {
        var self = this;
        var token = md5((new Date()).getTime().toString()).toString();

        self.DB.get("SELECT ID, USERNAME, FULLNAME, EMAIL FROM ACL_USERS WHERE USERNAME=:username AND PASSWORD=:password AND ACTIVE=1;", {
            ':username': username,
            ':password': md5(password).toString()
        }, function (error, row) {
            if (error == null) {
                if (row !== undefined) {
                    var user = row;
                    self.Auth[token] = {
                        'user': user,
                        'permissions': []
                    };
                    self.DB.all("WITH RECURSIVE\
                                    UNDER_ROLE(NAME, PARENT, DESCRIPTION, ID) AS(\
                                        SELECT ACL_ROLES.NAME, 0, ACL_ROLES.DESCRIPTION, ACL_ROLES.ID\
                                            FROM ACL_USERROLES\
                                            JOIN ACL_ROLES ON ACL_USERROLES.ROLEID = ACL_ROLES.ID\
                                            WHERE USERID = :uid AND ACL_USERROLES.ACTIVE = 1\
                                        UNION ALL\
                                        SELECT ACL_ROLES.NAME, UNDER_ROLE.PARENT + 1, ACL_ROLES.DESCRIPTION, ACL_ROLES.ID\
                                            FROM ACL_ROLES\
                                            JOIN UNDER_ROLE ON ACL_ROLES.PARENT = UNDER_ROLE.ID\
                                            WHERE ACL_ROLES.ACTIVE = 1\ ORDER BY 2 DESC\
                                    )\
                                SELECT DISTINCT ACL_PERMISSIONS.ID, ACL_PERMISSIONS.NAME, ACL_PERMISSIONS.DESCRIPTION\
                                    FROM UNDER_ROLE\
                                    JOIN ACL_ROLEPERMISSIONS ON UNDER_ROLE.ID = ACL_ROLEPERMISSIONS.ROLEID\
                                    JOIN ACL_PERMISSIONS ON ACL_ROLEPERMISSIONS.PERMISSIONID = ACL_PERMISSIONS.ID;", {
                        ':uid': user.ID
                    }, function (error, rows) {
                        if (error == null) {
                            self.Auth[token].rolecount = rows.length;
                            self.Auth[token].c = 0;
                            for (var idx in rows) {
                                var permission = rows[idx];
                                self.GetPermissionsUnder(permission, function (data) {
                                    data.forEach(function (perm) {
                                        var exists = us.findWhere(self.Auth[token].permissions, perm) != undefined;
                                        if (!exists) {
                                            self.Auth[token].permissions.push(perm);
                                        }
                                    });
                                    self.Auth[token].c++;
                                    // debugger;
                                    if (self.IsAuthReady(self.Auth[token].c, token)) {
                                        self.OnAuthenticationDone(token, callback);
                                    }
                                });
                            };
                            if (self.IsAuthReady(self.Auth[token].c, token)) {
                                self.OnAuthenticationDone(token, callback);
                            }
                        } else {
                            logger.error(error);
                            callback(error);
                        }
                    });
                } else {
                    logger.warn("Authentication failed for user: " + username);
                    callback(false);
                }
            } else {
                logger.error(error);
                callback(false);
            }
        });
    };

    Acl.prototype.IsAuthReady = function (c, token) {
        var self = this;
        return c == self.Auth[token].rolecount;
    };

    Acl.prototype.OnAuthenticationDone = function (token, callback) {
        var self = this;
        var permissions = {};
        self.Auth[token].permissions.forEach(function (permission) {
            if (!permissions.hasOwnProperty(permission.NAME)) {
                permissions[permission.NAME] = true;
            }
        });
        self.Auth[token].perms = permissions;
        callback(self.Auth[token]);
        delete self.Auth[token];
    };

    return Acl;
})();

exports.Acl = Acl;
