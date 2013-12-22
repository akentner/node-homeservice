'use strict';


/**
 *
 * @param moduleBus
 * @constructor
 * @param name
 */
function Mongo(name, moduleBus) {
  this.name = name;
  this.mongoose = require('mongoose');
  this.moduleBus = moduleBus;
  this.schema = {};

  var Schema = this.mongoose.Schema;

  this.config = {
    dsn: 'mongodb://localhost/test',
    expires: 60 * 60 * 24 * 180 // 366d
  };

  this.schema.Event = this.mongoose.model('Event', new Schema({
    _facility: String,
    _device: String,
    _type: String,
    _date: {type: Date, expires: this.config.expires},
    _ts: Number,
    data: Object
  }));
}

/**
 *
 */
Mongo.prototype.run = function () {
  var self = this;

  this.mongoose.connect(this.config.dsn);

  Object.keys(self.schema).forEach(function (key) {
    var Schema, channel;

    Schema = self.schema[key];
    channel = self.name + '.' + key;

    self.moduleBus.subscribe(channel, function (event) {
      var evt;
      evt = new Schema(event);
      evt.save(function (err) {
        if (err) {
          console.log('mongo err', err);
        }
      });
    });
  });
};

/**
 *
 * @param options
 */
Mongo.prototype.options = function (options) {
  var ObjectHelper, oh;

  ObjectHelper = require('../../ObjectHelper');
  oh = new ObjectHelper();

  this.config = oh.mergeRecursive(this.config, options);
};

/**
 *
 */
module.exports = Mongo;
