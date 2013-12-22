'use strict';

var Postal = require('postal');
var postal = new Postal();

var Rest = require('./lib/Modules/Rest');
var XMPP = require('./lib/Modules/XMPP');
var AMQP = require('./lib/Modules/AMQP');
var FHEM = require('./lib/Modules/FHEM');
var Mongo = require('./lib/Modules/Mongo');

var moduleBus = postal.channel();

var rest = new Rest('rest', moduleBus);
var xmpp = new XMPP('xmpp.googleTalkFhem', moduleBus);
var amqp = new AMQP('amqp.rabbitmq', moduleBus);
var fhem = new FHEM('fhem.rpi', moduleBus);
var mongo = new Mongo('mongo.domo', moduleBus);


amqp.options({
  host: 'localhost',
  port: 5672
});

xmpp.options({
  jid: 'fhem@lexsign.de',
  password: 'fhempass',
  events: {

  }
});

fhem.options({
  maxAttepts: 10,
  host: '192.168.178.20',
  port: 7072,
  events: {
    publish: {
      event: [
        'rest.socketio.events',
        'mongo.domo.Event',
        'amqp.rabbitmq.amfhetamin.events'
      ]
    },
    subscribe: {
    }
  }
});

rest.options({
  debug: true,
  port: 8081,
  docRoot: __dirname + '/../public'
});

mongo.options({
  dsn: 'mongodb://localhost/homeservice'
});

moduleBus.subscribe('*', function (event) {
  console.log('moduleBus', event);
});

mongo.run();
rest.run();
xmpp.run();
amqp.run();
fhem.run();
