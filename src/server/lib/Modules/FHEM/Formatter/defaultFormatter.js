'use strict';


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
