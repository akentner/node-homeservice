'use strict';


/**
 *
 * @param moduleBus
 * @constructor
 * @param name
 */
function AMQP(name, moduleBus) {
  this.name = name;
  this.amqp = require('amqp');
  this.moduleBus = moduleBus;

  this.config = {
    host: 'localhost',
    port: 5672
  };
}

/**
 *
 */
AMQP.prototype.run = function () {
//  var self = this;
  var connection = this.amqp.createConnection({host: 'localhost'});
  connection.on('ready', function () {
    connection.queue('xmpp', {autoDelete: false}, function (queue) {
      console.log(' [*] Waiting for XMPP messages. To exit press CTRL+C');
      queue.subscribe(function (msg) {
        console.log(' [x] Received %s', msg.data.toString('utf-8'));
      });
    });
    connection.queue('fhem', {autoDelete: false}, function (queue) {
      console.log(' [*] Waiting for messages. To exit press CTRL+C');
      queue.subscribe(function (msg) {
        console.log(' [x] Received %s', msg.data.toString('utf-8'));
      });
    });
  });
};

/**
 *
 * @param options
 */
AMQP.prototype.options = function (options) {
  var ObjectHelper, oh;

  ObjectHelper = require('../../ObjectHelper');
  oh = new ObjectHelper();

  this.config = oh.mergeRecursive(this.config, options);
};

/**
 *
 */
module.exports = AMQP;
