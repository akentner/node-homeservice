'use strict';

/**
 *
 */
module.exports = XMPP;

/**
 *
 * @param moduleBus
 * @constructor
 */
function XMPP(name, moduleBus) {
    this.name = name;
    this.moduleBus = moduleBus;
    this.xmpp = require('node-xmpp');
    this.client = {};
    this.defaultCmdNs = '';
    this.config = {
        jid: "",
        password: ""
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
            self.client.send(new self.xmpp.Element('presence', {test:"test"})
                .c('show').t('chat').up()
                .c('status').t('Happily echoing your <message/> stanzas')
            )
        })
        .on('stanza', function (stanza) {
            if ( (stanza.is('message')) && (stanza.getChild('body') !== undefined) && (stanza.attrs.type !== 'error') ) {
                self.send(self.handleStanza(stanza));
            }
        })
        .on('error', function (e) {
            console.error(e);
        })
    ;

    this.moduleBus.subscribe("xmpp.message", function (data) {
        console.log('xmpp.message', data);
        self.send(data);
    });

    this.moduleBus.subscribe("xmpp.status.req", function () {
        self.moduleBus.publish("xmpp.status.res", self.status);
    });
}

/**
 *
 * @param message
 */
XMPP.prototype.send = function (to, message) {
    to = "alexander.kentner@lexsign.de";
    this.client.send(new this.xmpp.Element('message', { to: to, type: 'chat' })
        .c('body').t(JSON.stringify(message))
    );
}

/**
 *
 * @param stanza
 */
XMPP.prototype.handleStanza = function (stanza) {
    var cmd = '';
    stanza.getChild('body').children.forEach(function(item) {
        cmd += item
    });
    var regex = new RegExp("^(help|use|fhem|test)\\s{0,1}.*");
    var match = regex.exec(this.defaultCmdNs + ' ' + cmd.trim(), "g");

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
}

/**
 *
 * @param options
 */
XMPP.prototype.options = function (options) {
    var ObjectHelper = require('../../ObjectHelper');
    var objectHelper = new ObjectHelper();
    this.config = objectHelper.mergeRecursive(this.config, options);
}
