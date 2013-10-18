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
    return '?' + _.map(pairs, function(pair) { return _.map(pair, encodeURIComponent).join('='); }).join('&');
  };

  utils.parseQueryParams = function() {
    var params = {};
    var match = /^\?(\S*)$/.exec(window.location.search);
    if (match == null || match.length !== 2) return params;
    var pairs = match[1].split(/[&;]/);
    for (var i=0, len=pairs.length; i < len; i++) {
      var pair = pairs[i].split('=');
      params[decodeURIComponent(pair[0])] = pair.length === 2 ? decodeURIComponent(pair[1]) : null;
    };
    return params;
  };

  _.mixin({
    objMap: function(obj, func, context) {
      return _.object(_.keys(obj), _.map(obj, func, context));
    }
  });
})( window );
