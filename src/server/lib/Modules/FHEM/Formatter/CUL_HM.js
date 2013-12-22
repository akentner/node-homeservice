'use strict';


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
