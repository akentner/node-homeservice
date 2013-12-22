'use strict';


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
