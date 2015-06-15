/**
 * Invoice
 */

var options = {
  // Describes when to break the page
  magicNumber: 750

, readyTimeout: 20000

  // Used to select the elements in a $page that will determine
  // the innerHeight of the element (since page is has a min-height),
  // we need to figure out $page.outerHeight() - inner.outerHeight()
, remainingTableHeightSelector: [
    '> :not(.order)'
  , '.order > :not(.order-bottom-wrapper)'
  , '.order-bottom-wrapper > *'
  ].join(', ')
};

$(function(){
  // Add in variable height els
  options.magicNumber += $('header').outerHeight();
  options.magicNumber += $('.order-info').outerHeight();

  adjustPage( $('.page'), function(){
    window.__page.ready();
  });

  setTimeout( function(){
    if ( !window.__page.isReady() ) window.__page.ready();
  }, options.readyTimeout );
});