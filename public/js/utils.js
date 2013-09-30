(function( exports ){
  var utils = exports.utils = exports.utils || {};

  utils.getPrice = function( $el ) {
    var val = $el.val().trim();
    return val ? Math.round(parseFloat(val) * 100) : null;
  };
})( window );