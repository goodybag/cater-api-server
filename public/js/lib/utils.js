if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    return module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var _ = require('lodash');

  var moment = require('moment');
  var utils = _;

  utils.getPrice = function( $el ) {
    var val = $el.val().trim();
    return val ? Math.round(parseFloat(val) * 100) : null;
  };

  utils.queryParams = function(data) {
    var pairs = _.flatten(_.map(data, function(value, key, obj) {
      return _.isArray(value) ? _.map(value, function(val) { return [key + '[]', val];}) : [[key, value]];
    }), true);
    return '?' + _.compact(_.map(pairs, function(pair) {
      return !_.contains([null, undefined, ''], pair[1]) ? _.map(pair, encodeURIComponent).join('=') : null
    })).join('&');
  };

  utils.parseQueryParams = function() {
    var params = {};
    var match = /^\?(\S*)$/.exec(window.location.search);
    if (match == null || match.length !== 2) return params;

    var pairs = _.map(match[1].split(/[&;]/), _.compose(
      function(str) {
        return _.object(['key', 'value'], str.split('='));
      },
      decodeURIComponent
    ));

    return _.objMap(_.groupBy(pairs, function(pair) { return pair.key.replace(/\[\]$/, ''); }),
                    function(list) {
                      var ret = _.pluck(list, 'value');  return /\[\]$/.test(list[0].key) ? ret : ret[0];
                    });
  };

  utils.uuid = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

  utils.joinIf = function(arr, sep) {
    return Array.prototype.join.call(utils.compact(arr), sep);
  }

  utils.capitalize = function(str) {
    if (!str) return '';
    return str[0].toUpperCase() + str.substring(1);
  }

  utils.dateTimeFormatter = function(date, format) {
    if (!date) return '';
    return moment(date).format(format || 'YYYY-MM-DD');
  }

  utils.timeFormatter = function(time, format) {
    // accepts both 24 hour time and 12 hour time
    if (!time) return '';
    if(typeof time == "object") time = time.toString();

    var datetime = new moment();
    time = time.toLowerCase().match(/(\d+)(?::(\d\d))?\s*(a|p)?/);

    if (time[3] && time[3] == 'a') { // AM
      datetime.hours(parseInt(time[1]) % 12);
    } else if (time[3] && time[3] == 'p') { // PM
      datetime.hours((parseInt(time[1]) % 12) + 12);
    } else { // assume 24 hour time
      datetime.hours(parseInt(time[1]));
    }

    datetime.minutes( parseInt(time[2]) || 0 );
    datetime.seconds(0);
    return datetime.format(format || 'HH:mm');
  }

  // taken from here: http://stackoverflow.com/a/4467559
  utils.mod = function(a, n) {
    return ((a % n) + n) % n;
  }

  _.mixin({
    objMap: function(obj, func, context) {
      return _.object(_.keys(obj), _.map(obj, func, context));
    },

    partialRight: function(func) {
      var args = Array.prototype.slice.call(arguments, 1);
      return function() {
        return func.apply(this, Array.prototype.slice.apply(arguments).concat(args));
      };
    }
  });

  return module.exports = utils;
});