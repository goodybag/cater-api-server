(function( exports ){
  var utils = exports.utils = exports.utils || {};

  utils.getPrice = function( $el ) {
    var val = $el.val().trim();
    return val ? Math.round(parseFloat(val) * 100) : null;
  };

  utils.queryParams = function(data){
    if (typeof data !== "object") return "";
    var params = "?";
    for (var key in data){
      if ([null, undefined, ""].indexOf(data[key]) > -1) continue;
      if (utils.isArray(data[key])){
        for (var i = 0, l = data[key].length; i < l; ++i){
          params += key + "[]=" + data[key][i] + "&";
        }
      } else {
        params += key + "=" + data[key] + "&";
      }
    }
    return params.substring(0, params.length - 1);
  };

  utils.parseQueryParams = function() {
    var params = {};
    var match = /^\?(\S*)$/.exec(window.location.search);
    if (match == null || match.length !== 2) return params;
    var pairs = match[1].split(/[&;]/);
    for (var i=0, len=pairs.length; i < len; i++) {
      var pair = pairs[i].split('=');
      if (pair.length === 2)
        params[pair[0]] = pair[1];
      if (pair.length === 1)
        params[pair[0]] = null;
    };
    return params;
  };
})( window );