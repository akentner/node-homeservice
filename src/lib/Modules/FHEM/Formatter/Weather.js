"use strict";

module.exports = Weather;

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
Weather.prototype.handle = function(event) {

    var data = {};
    var regex, match, queue;

    var ObjectHelper = require('../../../ObjectHelper');
    var objectHelper = new ObjectHelper();

    var moment = require('moment');

    event.data.forEach(function(elem) {
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
        ;

        regex = new RegExp("(^\\w+):\\s(.*)$", "g");
        match = regex.exec(elem.trim());

        if (match) {
            var value
            switch (match[1]) {
                case 'fetchdate':
                    //value = new Date(match[2]);
                    value = moment(match[2].replace('CET', '+0100').replace('CEST', '+0200'), ["DD MMM YYYY h:mm a ZZ"]).toJSON();
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
                    value = parseInt(match[2]);
                    break;
                default:
                    value = match[2];
            }
            queue = match[1].split('_');
            while(queue.length) {
                var part = {};
                part[queue.pop()] = value;
                value = part;
            }
            data = objectHelper.mergeRecursive(data, value);
        }
    });

    event.data = data;
    return event;
}
