/**
*   Goodybag Widgets
*/

(function Widgets (window, document) {
  var DOMReady = function( callback ) {
    var evt = 'addEventListener';
    document[evt] ? document[evt]('DOMContentLoaded', callback) : window.attachEvent('onload', callback);
  };

  var embeddedOrderIcon = function() {
    var orderBtns = document.querySelectorAll('.goodybag-order-button');
    for (var i=0; i < orderBtns.length; i++) {
      orderBtns[i].innerHTML = [
      '<img'
      ,' src=\"https://cdn.filepicker.io/api/file/jLhugLRSQAJVdUe88acg/convert? '
      , 'cache=true'
      , '&fit=scale'
      , '&w=50'
      , '&h=50\">'
      ].join('');
    }
  };

  embeddedOrderIcon();
})(window, document);
