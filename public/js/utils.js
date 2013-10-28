(function( exports ){
  var utils = exports.utils = exports.utils || {};

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
})( window );
