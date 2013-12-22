'use strict';


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
