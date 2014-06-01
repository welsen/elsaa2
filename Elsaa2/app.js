
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
var mongoose = require('mongoose');
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

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
    mongoose.connect('mongodb://localhost/test');
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function callback() {
        console.log('Connection to MongoDB is open...');
    });
});
