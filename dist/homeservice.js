'use strict';

var amqp = require('amqp');

var connection = amqp.createConnection({host: 'localhost'});

connection.on('ready', function () {
  connection.queue('hello', {autoDelete: false}, function (queue) {

    console.log(' [*] Waiting for messages. To exit press CTRL+C');
    queue.subscribe(function (msg) {
      console.log(' [x] Received %s', msg.data.toString('utf-8'));
    });
  });
});;'use strict';

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
;'use strict';


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
;'use strict';

/**
 *
 * @constructor
 */
function CUL_FHTTK() {
  console.log('CUL_FHTTK Formatter');
}

/**
 *
 * @param event
 * @returns {*}
 */
CUL_FHTTK.prototype.handle = function (event) {
  var data = {};

  data.open = (event.data[0].indexOf('Open') !== -1) ? 1 : 0;
  data.status = (data.open === 1) ? 'open' : 'closed';
  event.data = data;

  return event;
};

module.exports = CUL_FHTTK;
;'use strict';


/**
 *
 * @constructor
 */
function CUL_HM() {
  console.log('CUL_HM Formatter');
}

/**
 *
 * @param event
 * @returns {*}
 */
CUL_HM.prototype.handle = function (event) {

  var data = {};
  var regex;
  var match;

  event.data.forEach(function (elem) {
    regex = new RegExp('(^\\w+):\\s(.*)$', 'g');
    match = regex.exec(elem.trim());
    if (match) {
      switch (match[1]) {
        case 'temperature':
        case 'humidity':
        case 'RSSI':
          data[match[1]] = parseFloat(match[2]);
          break;
        case 'T':
          // delete
          break;
        default:
          data[match[1]] = match[2];
      }
    }
  });
  event.data = data;
  return event;
};

module.exports = CUL_HM;
;'use strict';


/**
 *
 * @constructor
 */
function FS20() {
  console.log('FS20 Formatter');
}

/**
 *
 * @param event
 * @returns {*}
 */
FS20.prototype.handle = function (event) {
  var data = {};
  data.status = event.data[0];
  event.data = data;
  return event;
};


module.exports = FS20;
;'use strict';


/**
 *
 * @constructor
 */
function PRESENCE() {
  console.log('PRESENCE Formatter');
}

/**
 *
 * @param event
 * @returns {*}
 */
PRESENCE.prototype.handle = function (event) {
  var data = {};
  data.present = (event.data[0] === 'present') ? 1 : 0;
  data.status = (data.present === 1) ? 'present' : 'absent';
  event.data = data;
  return event;
};

module.exports = PRESENCE;
;'use strict';


/**
 *
 * @constructor
 */
function Weather() {
  console.log('Weather Formatter');
}

/**
 *
 * @param event
 * @returns {*}
 */
Weather.prototype.handle = function (event) {

  var data = {};
  var regex, match, queue;

  var ObjectHelper = require('../../../ObjectHelper');
  var objectHelper = new ObjectHelper();

  var moment = require('moment');

  event.data.forEach(function (elem) {
    elem = elem
        .replace('fc', 'forecast_day')
        .replace('fc', 'forecast_day')
        .replace('pressure:', 'pressure_value:')
        .replace('condition:', 'condition_text:')
        .replace('wind_condition_text:', 'wind_condition:')
        .replace('wind:', 'wind_speed:')
        .replace('code:', 'condition_code:')
        .replace('day_of_week:', 'weekday:')
        .replace('pressure_trend:', 'pressure_trend_change:')
        .replace('low_c:', 'temperature_low:')
        .replace('high_c:', 'temperature_high:')
        .replace('temp_c:', '')
        .replace('temp_f:', '')
        .replace('current_date_time:', 'fetchdate:')
        .replace(/T:.+H:.+W:.+/g, '');
    regex = new RegExp('(^\\w+):\\s(.*)$', 'g');
    match = regex.exec(elem.trim());

    if (match) {
      var value;
      switch (match[1]) {
        case 'fetchdate':
          //value = new Date(match[2]);
          value = moment(match[2].replace('CET', '+0100').replace('CEST', '+0200'), ['DD MMM YYYY h:mm a ZZ']).toJSON();
          break;
        case 'humidity':
        case 'temperature':
        case 'wind_chill':
        case 'wind_speed':
        case 'wind_direction':
        case 'pressure_value':
        case 'pressure_trend_change':
        case 'forecast_day1_temperature_low':
        case 'forecast_day1_temperature_high':
        case 'forecast_day2_temperature_low':
        case 'forecast_day2_temperature_high':
        case 'forecast_day3_temperature_low':
        case 'forecast_day3_temperature_high':
        case 'forecast_day4_temperature_low':
        case 'forecast_day4_temperature_high':
        case 'forecast_day5_temperature_low':
        case 'forecast_day5_temperature_high':
          value = parseFloat(match[2]);
          break;
        case 'visibility':
        case 'forecast_day1_condition_code':
        case 'forecast_day2_condition_code':
        case 'forecast_day3_condition_code':
        case 'forecast_day4_condition_code':
        case 'forecast_day5_condition_code':
          value = parseInt(match[2], 10);
          break;
        default:
          value = match[2];
      }
      queue = match[1].split('_');
      while (queue.length) {
        var part = {};
        part[queue.pop()] = value;
        value = part;
      }
      data = objectHelper.mergeRecursive(data, value);
    }
  });

  event.data = data;
  return event;
};

module.exports = Weather;
;'use strict';


/**
 *
 * @constructor
 */
function defaultHandler() {
  console.log('defaultHandler Formatter');
}

/**
 *
 * @param event
 * @returns {*}
 */
defaultHandler.prototype.handle = function (event) {

  var data = {};
  var regex, match;

  event.data.forEach(function (elem) {
    regex = new RegExp('(^\\w+):\\s(.*)$', 'g');
    match = regex.exec(elem.trim());
    if (match) {
      data[match[1]] = match[2];
    } else {
      data._raw = data._raw || [];
      data._raw.push(elem.trim());
    }
  });
  event.data = data;

  return event;
};

module.exports = defaultHandler;
;'use strict';


/**
 *
 * @param moduleBus
 * @constructor
 * @param name
 * @param mongoose
 * @param name
 * @param mongoose
 */
function FHEM(name, moduleBus) {
  this.name = name;
  this.moduleBus = moduleBus;

  this.handler = {};
  this.handlerInstances = {};

  this.config = {
    maxAttepts: 5,
    host: '192.168.178.20',
    port: 7072,
    events: {
      publish: {
        event: []
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
        var events, lines;

        lines = data.toString().replace('\r\n', '\n').split('\n');

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
            self.config.events.publish.event.forEach(function (channel) {
              self.moduleBus.publish(channel, event);
            });
          });
        }
      });

      socket.on('end', function () {
        var now = new Date();
        console.log(now + ' - FHEM at ' + self.config.host + ' - Disconnected');
        setTimeout(doConnect, 10000);
      });

      socket.on('timeout', function () {
        var now = new Date();
        console.log(now + ' - FHEM at ' + self.config.host + ' - Timed out');
        setTimeout(doConnect, 10000);
      });

      socket.on('error', function (e) {
        var now = new Date();
        console.log(now + ' - FHEM at ' + self.config.host + ' - Error:', e);
        setTimeout(doConnect, 10000);
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

    lines.forEach(function (elem) {
      event = {};
      if (elem === '') {
        return;
      }
      regex = new RegExp('(^\\w+)\\s([\\w\\.]+)\\s(.*)$', 'gm');
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
  };

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
};

/**
 *
 * @param options
 */
FHEM.prototype.options = function (options) {
  var ObjectHelper, oh;

  ObjectHelper = require('../../ObjectHelper');
  oh = new ObjectHelper();

  this.config = oh.mergeRecursive(this.config, options);
};

/**
 *
 */
module.exports = FHEM;
;'use strict';


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
;'use strict';

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
  var ObjectHelper, oh;

  ObjectHelper = require('../../ObjectHelper');
  oh = new ObjectHelper();

  this.config = oh.mergeRecursive(this.config, options);
};

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

  this.moduleBus.subscribe('xmpp.status.res', function (msg) {
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
    });
  });

  server.get(/^\/public\/?.*/, this.restify.serveStatic({
    directory: this.config.docRoot.replace('/public', '')
  }));

  server.get('/xmpp/status', function (req, res) {
    self.moduleBus.publish('xmpp.status.req', {});
    res.send(200, {status: 'success', data: data.xmpp.status});
  });

  server.post('/xmpp/message', function (req, res, next) {
    if (req.params.message === undefined) {
      return next(new self.restify.InvalidArgumentError('message must be supplied'));
    }
    self.moduleBus.publish('xmpp.message', req.params);
    res.send(201, {status: 'success', params: req.params});
  });

  server.listen(this.config.port, function () {
    console.log('%s listening at %s', server.name, server.url);
  });
};

/**
 *
 */
module.exports = Rest;
;'use strict';


/**
 *
 * @param moduleBus
 * @constructor
 * @param name
 */
function XMPP(name, moduleBus) {
  this.name = name;
  this.moduleBus = moduleBus;
  this.xmpp = require('node-xmpp');
  this.client = {};
  this.defaultCmdNs = '';
  this.config = {
    jid: '',
    password: ''
  };
}

/**
 *
 */
XMPP.prototype.run = function () {

  this.client = new this.xmpp.Client({
    jid: this.config.jid,
    password: this.config.password
  });

  this.status = {};

  var self = this;
  this.client
    .on('online', function (sessionInfo) {
      console.log('XMPP online');
      self.status = sessionInfo;
      self.client.send(new self.xmpp.Element('presence', {test: 'test'})
        .c('show').t('chat').up()
        .c('status').t('Happily echoing your <message/> stanzas')
      );
    })
    .on('stanza', function (stanza) {
      if ((stanza.is('message')) && (stanza.getChild('body') !== undefined) && (stanza.attrs.type !== 'error')) {
        self.send(self.handleStanza(stanza));
      }
    })
    .on('error', function (e) {
      console.error(e);
    })
  ;

  this.moduleBus.subscribe('xmpp.message', function (data) {
    console.log('xmpp.message', data);
    self.send(data);
  });

  this.moduleBus.subscribe('xmpp.status.req', function () {
    self.moduleBus.publish('xmpp.status.res', self.status);
  });
};

/**
 *
 * @param message
 * @param to
 */
XMPP.prototype.send = function (to, message) {
  to = 'alexander.kentner@lexsign.de';
  this.client.send(new this.xmpp.Element('message', { to: to, type: 'chat' })
    .c('body').t(JSON.stringify(message))
  );
};

/**
 *
 * @param stanza
 */
XMPP.prototype.handleStanza = function (stanza) {
  var cmd, regex, match;
  cmd = '';
  stanza.getChild('body').children.forEach(function (item) {
    cmd += item;
  });
  regex = new RegExp('^(help|use|fhem|test)\\s{0,1}.*');
  match = regex.exec(this.defaultCmdNs + ' ' + cmd.trim(), 'g');

  console.log(match);
  if (match) {
    switch (match[1]) {
      case 'help':
        console.log('handle help:', match.input);
        break;
      case 'use':
        if (match[2]) {
          this.defaultCmdNs = match[2].match(/(help|use|fhem|test)/g).toString();
          console.log('use:', this.defaultCmdNs);
        }
        console.log('handle use:', match.input);
        break;
      case 'fhem':
        console.log('handle fhem:', match.input);
        break;
      case 'test':
        console.log('handle test:', match.input);
        break;
    }
  }

  return 'meep';
};

/**
 *
 * @param options
 */
XMPP.prototype.options = function (options) {
  var ObjectHelper, oh;

  ObjectHelper = require('../../ObjectHelper');
  oh = new ObjectHelper();

  this.config = oh.mergeRecursive(this.config, options);
};

/**
 *
 */
module.exports = XMPP;
;'use strict';


/**
 *
 * @param moduleBus
 * @constructor
 */
function ObjectHelper() {
}

/**
 *
 * @param {Object} targetObject
 * @param {Object} sourceObject
 * @returns {Object}
 */
ObjectHelper.prototype.mergeRecursive = function (targetObject, sourceObject) {
  var property;
  for (property in sourceObject) {
    if (property) {
      try {
        targetObject[property] = (sourceObject[property].constructor === Object) ?
          this.mergeRecursive(targetObject[property], sourceObject[property]) :
          sourceObject[property];
      }
      catch (e) {
        targetObject[property] = sourceObject[property];
      }
    }
  }
  return targetObject;
};

/**
 *
 */
module.exports = ObjectHelper;
