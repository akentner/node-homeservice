'use strict';

/**
 *
 */
module.exports = FHEM;

/**
 *
 * @param moduleBus
 * @constructor
 */
function FHEM(name, moduleBus, mongoose) {
    this.name = name;
    this.moduleBus = moduleBus;

    this.handler = {};
    this.handlerInstances = {};

    this.config = {
        maxAttepts: 5,
        host: "192.168.178.20",
        port: 7072,
        events: {
            publish: {
                event:[]
            },
            subscribe: {

            }
        }
    };
}

/**
 *
 */
FHEM.prototype.run = function () {
    var attempt = 0;
    var net = require('net');
    var socket = net.Socket();

    var buffer = [];
    var self = this;

    var doConnect = function () {
        if (attempt < self.config.maxAttepts) {
            attempt++;
            socket = net.connect({
                    host: self.config.host,
                    port: self.config.port
                },
                function () {
                    var now = new Date();
                    attempt = 0;
                    console.log(now + ' - FHEM at ' + self.config.host + ' - Connected');
                    socket.setKeepAlive(true);
                    socket.write('inform on\r\n');
                }
            );

            socket.on('data', function (data) {
                var events, line, lines, i;

                lines = data.toString().replace("\r\n", "\n").split("\n");

                if (buffer.length > 0) {
                    buffer[lines.length - 1] += lines.splice(0, 1).toString();
                    buffer = buffer.concat(lines);
                }

                if (lines[lines.length - 1] !== '') {
                    buffer = lines;
                } else {
                    if (buffer.length > 0) {
                        lines = buffer;
                        buffer = [];
                    }

                    events = handleEvents(formatDataAsJson(lines));
                    events.forEach(function (event) {
                        self.config.events.publish.event.forEach(function(channel) {
                            self.moduleBus.publish(channel, event);
                        });
                    });
                }
            });

            socket.on('end', function () {
                var now = new Date();
                console.log(now + ' - FHEM at ' + self.config.host + ' - Disconnected');
                setTimeout(doConnect, 10000)
            });

            socket.on('timeout', function () {
                var now = new Date();
                console.log(now + ' - FHEM at ' + self.config.host + ' - Timed out');
                setTimeout(doConnect, 10000)
            });

            socket.on('error', function (e) {
                var now = new Date();
                console.log(now + ' - FHEM at ' + self.config.host + ' - Error:', e);
                setTimeout(doConnect, 10000)
            });

        } else {
            var now = new Date();
            console.log(now + ' - FHEM connection lost' + self.config.maxAttepts + ' times, no more tries');
        }
    };

    doConnect();

    /**
     *
     * @param lines
     * @returns {{}}
     */
    var formatDataAsJson = function (lines) {
        var json = {};
        var regex;
        var match;
        var event;
        var device;

        lines.forEach(function (elem, idx) {
            event = {};
            if (elem == '') {
                return;
            }
            regex = new RegExp("(^\\w+)\\s([\\w\\.]+)\\s(.*)$", "gm");
            match = regex.exec(elem.trim());

            if (match) {
                device = match[2];
                json[device] = json[device] || {};
                json[device]._facility = '';
                json[device]._device = device;
                json[device]._type = match[1];
                json[device]._date = {};
                json[device]._ts = 0;
                json[device].data = json[device].data || [];
                json[device].data.push(match[3]);
            }
        });
        return json;
    }

    /**
     *
     * @param events
     * @returns {Array}
     */
    var handleEvents = function (events) {
        var data = [];
        var event;
        var handledEvent;

        Object.keys(events).forEach(function (key) {
            var now;
            event = events[key];
            try {
                self.handler[event._type] = self.handler[event._type] || require('./FHEM/Formatter/' + event._type);
            } catch (e) {
                self.handler[event._type] = require('./Formatter/defaultFormatter');
            }
            self.handlerInstances[event._type] = self.handlerInstances[event._type] || new self.handler[event._type]();
            handledEvent = self.handlerInstances[event._type].handle(event);
            now = new Date();
            handledEvent._facility = self.name;
            handledEvent._date = now;
            handledEvent._ts = now.getTime();
            data.push(handledEvent);
        });
        return data;
    };
}

/**
 *
 * @param options
 */
FHEM.prototype.options = function (options) {
    var ObjectHelper = require('../../ObjectHelper');
    var objectHelper = new ObjectHelper();
    this.config = objectHelper.mergeRecursive(this.config, options);
}
