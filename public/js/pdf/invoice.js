/**
 * Receipt
 */

var options = {
  itemSelector: 'table tbody tr'

, onPageClone: function( $page, $clone ){
    $page.find('.order-bottom-wrapper').remove();
  }

, readyTimeout: 20000
};

$(function(){
  adjustPage( $('.page'), options, function(){
    window.__page.ready();
  });

  setTimeout( function(){
    if ( !window.__page.isReady() ) window.__page.ready();
  }, options.readyTimeout );
});