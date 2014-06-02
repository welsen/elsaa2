
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var io = require('socket.io');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var util = require('util');
var events = require('events');
var mongodb = require('mongodb').MongoClient;
var md5 = require('crypto-js/md5');
var vidStreamer = require("vid-streamer");

global.log4js = require('log4js');
global.log4js.configure({
    appenders: [
        {
            type: 'file',
            filename: 'logs/server.log',
            category: 'server'
        },
        {
            type: 'file',
            filename: 'logs/elsaa.log',
            category: 'elsaa'
        }
    ]
});

var logger = global.log4js.getLogger('server');
var us = require('underscore');

var MongoDbStore = require('connect-mongo')(express);

function serverLogger() {
    var immediate = arguments[0];
    return function(req, res, next) {
        var sock = req.socket;
        req._startTime = new Date;
        var url = req.originalUrl || req.url;
        var method = req.method;
        var responseTime = String(Date.now() - req._startTime);
        var status = res.statusCode || null;
        var referrer = req.headers['referer'] || req.headers['referrer'];

        var remoteAddr = null;
        if (req.ip) remoteAddr = req.ip;
        if (req._remoteAddress) remoteAddr = req._remoteAddress;
        if (sock.socket) remoteAddr = sock.socket.remoteAddress;
        remoteAddr = sock.remoteAddress;

        var httpVersion = req.httpVersionMajor + '.' + req.httpVersionMinor;
        var userAgent = req.headers['user-agent'];

        function logRequest() {
            res.removeListener('finish', logRequest);
            res.removeListener('close', logRequest);
            logger.info(util.format('%s "%s %s HTTP/%s" %s %s "%s" "%s" "response: %s ms"',
                remoteAddr, method, url, httpVersion, status, res._headers['content-length'], referrer || '', userAgent, responseTime));
        }

        if (immediate) {
            logRequest();
        } else {
            res.on('finish', logRequest);
            res.on('close', logRequest);
        }

        next();
    };
}

var Acl = require('./modules/acl').Acl;

var ElsaaEventEmitter = function () {
    events.EventEmitter.call(this);
};
util.inherits(ElsaaEventEmitter, events.EventEmitter);
var ElsaaEventHandler = new ElsaaEventEmitter();

ElsaaEventHandler.on('elsaa.init.done', function () {
    logger.info('Init done...');
    initDatabase();
});
ElsaaEventHandler.on('elsaa.database.done', function () {
    logger.info('Database initilaized...');
    initRoutes();
});
ElsaaEventHandler.on('elsaa.routes.done', function () {
    logger.info('Routes initialized...');
    initServer();
});
ElsaaEventHandler.on('elsaa.server.done', function () {
    logger.info('Server ready...');
    startElsaa();
});

var sessionSecret = md5('ELSAA2').toString();

var privateKey = fs.readFileSync(path.join(__dirname, 'ssl', 'localhost.key')).toString();
var certRequest = fs.readFileSync(path.join(__dirname, 'ssl', 'localhost.csr')).toString();
var certificate = fs.readFileSync(path.join(__dirname, 'ssl', 'localhost.crt')).toString();

var credentials = {
    key: privateKey,
    ca: certRequest,
    cert: certificate
};

var app = null;
var serverHttp = null;
var serverHttps = null;
var websocketHttp = null;
var websocketHttps = null;
var db = null;
var acl = null;

var vidStreamerOptions = {
    "mode": "development",
    "forceDownload": false,
    "random": false,
    "rootFolder": path.join(__dirname, 'public', 'videos'),
    "rootPath": "videos/",
    "server": "VidStreamer.js/0.1.4"
};

vidStreamer.settings(vidStreamerOptions);

var app = express();

function init() {
    app = express();

    // all environments
    app.set('port-http', 8080);
    app.set('port-https', 8443);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(express.compress());
    app.use(express.favicon());
    app.use(serverLogger());
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.multipart());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: sessionSecret,
        store: new MongoDbStore({
            db: 'elsaa'
        })
    }));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

    // development only
    if ('development' == app.get('env')) {
        app.use(express.errorHandler());
    }

    ElsaaEventHandler.emit('elsaa.init.done');
}

function initRoutes() {
    app.get('/', routes.main.Index);
    app.get('/login', routes.main.Login);
    app.post('/login/authenticate', routes.main.LoginAuthenticate);
    app.get('/logout', routes.main.Logout);

    app.get('/admin', routes.admin.Index);
    app.get('/admin/login', routes.admin.Login);
    app.post('/admin/login/authenticate', routes.admin.LoginAuthenticate);
    app.get('/admin/logout', routes.admin.Logout);

    app.get('/admin/permissions', routes.admin.Permissions);
    app.post('/admin/permissions/all', routes.admin.AllPermissions);
    app.post('/admin/permissions/add', routes.admin.AddPermissions);
    app.post('/admin/permissions/edit', routes.admin.EditPermissions);
    app.post('/admin/permissions/delete', routes.admin.DeletePermissions);

    app.get('/admin/roles', routes.admin.Roles);
    app.post('/admin/roles/all', routes.admin.AllRoles);
    app.post('/admin/roles/add', routes.admin.AddRoles);
    app.post('/admin/roles/edit', routes.admin.EditRoles);
    app.post('/admin/roles/delete', routes.admin.DeleteRoles);
    app.post('/admin/roles/permissions', routes.admin.GetRolePermissions);
    app.post('/admin/roles/permissions/set', routes.admin.SetRolePermissions);

    app.get('/admin/users', routes.admin.Users);
    app.post('/admin/users/all', routes.admin.AllUsers);
    app.post('/admin/users/add', routes.admin.AddUsers);

    app.get('/videos/', vidStreamer);

    loadDynamicModules();
}

function loadDynamicModules() {
    // global.db.all("SELECT * FROM ELSAA_EXTERNAL_MODULES;", function (error, rows) {
    //     if (error == null) {
    //         rows.forEach(function (extModule) {
    //             (function () {
    //                 global[extModule.NAME] = require('./modules/' + extModule.NAME);
    //                 console.log(global[extModule.NAME]);
    //             })();
    //             global.db.all('SELECT * FROM ELSAA_MODULE_ROUTES WHERE MODULEID=:id;', {
    //                 ':id': extModule.ID
    //             }, function (innerError, innerRows) {
    //                 if (innerError == null) {
    //                     innerRows.forEach(function (moduleRoute) {
    //                         (new Function("app", "app." + moduleRoute.TYPE + "('" + moduleRoute.ROUTE + "', " + moduleRoute.CALL + ");"))(app);
    //                     });
    //                 } else {
    //                     logger.error("Creating Module Routes failed...");
    //                 }
    //             });
    //         });
             ElsaaEventHandler.emit('elsaa.routes.done');
    //     } else {
    //         logger.error("Loading Modules failed...");
    //     }
    // });
}

function initWebsocket(websocketRef, server, secure) {
    websocketRef = io.listen(server, {
        secure: secure
    });
    var chat = websocketRef.of('/chat').on('connection', function (socket) {
        socket.on('login', function (options, id) {
            var data = {
                'message': 'Logged in successfully'
            };
            socket.emit('login', data, id);
        }).on('say', function (options, id) {
            var data = {
                'message': options
            };
            chat.emit('say', data, id);
        }).on('disconnect', function () {
            var data = {
                'message': util.format('User disconnected: %s', socket.id)
            };
            chat.emit('say', data, '#chatMain');
        });
    });
}

function initServer() {
    serverHttp = http.createServer(app).listen(app.get('port-http'), function () {
        initWebsocket(websocketHttp, serverHttp);
        logger.info(util.format('WebServer listening on port: %d', app.get('port-http')));
    });
    serverHttps = https.createServer(credentials, app).listen(app.get('port-https'), function () {
        initWebsocket(websocketHttps, serverHttps, true);
        logger.info(util.format('Secure WebServer listening on port: %d', app.get('port-https')));
    });
    ElsaaEventHandler.emit('elsaa.server.done');
}

function initDatabase() {
    mongodb.connect("mongodb://localhost:27017/elsaa", function callback(err, db) {
        if (!err) {
            global.db = db;
            logger.info('Connection with Database established');
            ElsaaEventHandler.emit('elsaa.database.done');
        }
    });
}

function startElsaa() {
    logger.info("Starting ELSAA...");
    global.acl = new Acl(global.db);

    global.acl.AddRole('testrole1', 'this is a testrole #1 no parent', null, false, function () {
        console.log('done...');
        global.acl.AddRole('testrole2', 'this is a testrole 2# with parent', "538c67d2d514fa3005585af0", false, function () {
            global.acl.GetRolesUnder("538c67d2d514fa3005585af0", function (rows) {
                console.log(rows);
            });
        });
        // global.acl.UpdateRole("538c57f4c8832778230af17d", "This is a test-role with no parent: 1#", function () {
        //     console.log('done...');
        //     // global.acl.DeleteRole("538c57f4c8832778230af17d", function () {
        //     //     console.log('done...');
        //     // });
        // });
    });

    console.log("Elsaa Started");
}

init();
