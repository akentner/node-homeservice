'use strict';

/**
 *
 */
module.exports = ObjectHelper;

/**
 *
 * @param moduleBus
 * @constructor
 */
function ObjectHelper(moduleBus) {
}

/**
 *
 * @param {Object} targetObject
 * @param {Object} sourceObject
 * @returns {Object}
 */
ObjectHelper.prototype.mergeRecursive = function (targetObject, sourceObject) {
    for (var property in sourceObject) {
        try {
            targetObject[property] = (sourceObject[property].constructor == Object)
                ? this.mergeRecursive(targetObject[property], sourceObject[property])
                : sourceObject[property];
        }
        catch (e) {
            targetObject[property] = sourceObject[property];
        }
    }
    return targetObject;
}
