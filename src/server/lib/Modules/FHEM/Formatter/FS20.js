'use strict';


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
