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
})( window );