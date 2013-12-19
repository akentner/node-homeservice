'use strict';

/**
 *
 */
module.exports = Rest;

/**
 *
 * @constructor
 */
function Rest(name, channel) {
    this.name = name;
    this.restify = require('restify');
    this.moduleBus = channel;
    this.data = {};
    this.config = {
        debug: false,
        port: 8080,
        docRoot: '',
        events: {
            publish: {
            },
            subscribe: {
                sockeio: [
                    'events'
                ]
            }
        }
    };

}

/**
 *
 * @param options
 */
Rest.prototype.options = function (options) {
    var ObjectHelper = require('../../ObjectHelper');
    var objectHelper = new ObjectHelper();
    this.config = objectHelper.mergeRecursive(this.config, options);
}

/**
 *
 */
Rest.prototype.run = function () {
    var server = this.restify.createServer()
            .use(this.restify.fullResponse())
            .use(this.restify.bodyParser())
        ;

    var io = require('socket.io').listen(server);
    var fs = require('fs');

    var self = this;
    var data = {};

    io.set('log level', self.config.debug ? 3 : 1);
    console.log('socket io log level', io.get('log level'));
    io.sockets.on('connection', function (socket) {
        socket.emit('messages', {msg: 'start socket.io'});

        self.config.events.subscribe.sockeio.forEach(function (key) {
            var channel = self.name + '.socketio.' + key;
            socket.emit('messages', {msg: 'listing for channel "' + key + '" on moduleBus "' + channel + '"'});
            self.moduleBus.subscribe(channel, function (event) {
                socket.emit(key, event);
            });
        });
    });


    var respond = function respond(req, res, next) {
        res.send('hello ' + req.params.name + ' ' + self.config.suffix);
    };

    this.moduleBus.subscribe("xmpp.status.res", function (msg) {
        data.xmpp = data.xmpp || {};
        data.xmpp.status = msg;
    });

    server.get('/', function (req, res, next) {
        fs.readFile(self.config.docRoot + '/index.html', function (err, data) {
            if (err) {
                next(err);
                return;
            }

            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(data);
            next();
        })
    });

    server.get(/^\/static\/?.*/, this.restify.serveStatic({
        directory: this.config.docRoot.replace('/static', '')
    }));

    server.get('/xmpp/status', function (req, res, next) {
        self.moduleBus.publish("xmpp.status.req", {});
        res.send(200, {status: "success", data: data.xmpp.status});
    });

    server.post('/xmpp/message', function (req, res, next) {
        if (req.params.message === undefined) {
            return next(new self.restify.InvalidArgumentError('message must be supplied'))
        }
        self.moduleBus.publish("xmpp.message", req.params);
        res.send(201, {status: "success", params: req.params});
    })

    server.listen(this.config.port, function () {
        console.log('%s listening at %s', server.name, server.url);
    });
}
