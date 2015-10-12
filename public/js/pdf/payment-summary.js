/**
 * Payment Summary
 */

var options = {
  readyTimeout: 20000

, itemSelector: 'table tbody tr'

, onPageClone: function( $page, $clone ){
    $page.find('.order-bottom-wrapper').remove();
  }
};

$(function(){
  adjustPage( $('.page'), options, function(){
    window.__page.ready();
  });

  setTimeout( function(){
    if ( !window.__page.isReady() ) window.__page.ready();
  }, options.readyTimeout );
});