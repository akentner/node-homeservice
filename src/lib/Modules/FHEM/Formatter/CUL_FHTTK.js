"use strict";

module.exports = CUL_FHTTK;

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
CUL_FHTTK.prototype.handle = function(event) {
    var data = {};

    data.open = (event.data[0].indexOf("Open") !== -1) ? 1 :0;
    data.status = (data.open == 1) ? 'open' : 'closed';
    event.data = data;

    return event;
}
