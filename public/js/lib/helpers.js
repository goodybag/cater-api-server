if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    return module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var _ = require('lodash');

  var moment = require('moment');

  var helpers = {};

  helpers.timeToRange = function( time, format, options ){
    if ( typeof time !== 'string' ){
      throw new Error('Invalid type for parameter `time`');
    }

    if ( typeof format !== 'string' ){
      throw new Error('Invalid type for parameter `format`');
    }

    options = options || {};
    options.padding = options.padding || 15;
    options.distribution = options.distribution || {
      before: [ 1, 3 ]
    , after:  [ 2, 3 ]
    };

    var padding       = options.padding;
    var distribution  = options.distribution;
    var before = -distribution.before[0] * ( padding / distribution.before[1] );
    var after  =  distribution.after[0]  * ( padding / distribution.after[1]  );

    return [
      moment( time, format ).add( 'minute', before ).format( format )
    , moment( time, format ).add( 'minute', after ).format( format )
    ];
  };

  helpers.getPrice = function( $el ) {
    var val = $el.val().trim();
    return val ? Math.round(parseFloat(val) * 100) : null;
  };

  helpers.queryParams = function(data) {
    var pairs = _.flatten(_.map(data, function(value, key, obj) {
      return _.isArray(value) ? _.map(value, function(val) { return [key + '[]', val];}) : [[key, value]];
    }), true);
    return '?' + _.compact(_.map(pairs, function(pair) {
      return !_.contains([null, undefined, ''], pair[1]) ? _.map(pair, encodeURIComponent).join('=') : null
    })).join('&');
  };

  helpers.parseQueryParams = function() {
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

  helpers.uuid = function(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

  helpers.searchByFacets = function( items, criteria, types ){
    types = types || types;

    return _.filter( items, function( item ){
      var key, i, l, result, criterion;
      for ( key in criteria ){
        criterion = criteria[ key ];

        if ( types[ key ] === 'or' ){
          result = false;

          for ( i = 0, l = criterion.length; i < l; ++i ){
            if ( item[ key ].indexOf( criterion[ i ] ) > -1 ){
              result = true;
              break;
            }
          }
        } else {
          result = true;

          for ( i = 0, l = criterion.length; i < l; ++i ){
            if ( _.isArray( item[ key ] ) )
            if ( item[ key ].indexOf( criterion[ i ] ) === -1 ){
              result = false;
            }
          }
        }

        if ( !result ) return false;
      }

      return true;
    });
  };

  helpers.joinIf = function(arr, sep) {
    return Array.prototype.join.call(_.compact(arr), sep);
  }

  helpers.capitalize = function(str) {
    if (!str) return '';
    return str[0].toUpperCase() + str.substring(1);
  }

  helpers.dateTimeFormatter = function(date, format) {
    if (!date) return '';
    return moment(date).format(format || 'YYYY-MM-DD');
  }

  helpers.timeFormatter = function(time, format) {
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
  helpers.mod = function(a, n) {
    return ((a % n) + n) % n;
  }

  return module.exports = helpers;
});