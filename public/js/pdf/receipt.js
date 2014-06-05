/**
 * Receipt
 */

var options = {
  // Describes when to break the page
  magicNumber: 920

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
  // Commented out in #904
  // Since the adjustPage function takes into account all of these heights,
  // there's no need to subtract them from the magicNumber. I'm not sure
  // the exact rationale of subtracting them in the first place. Furthermore,
  // the magicNumber simply becomes the pre-defined height of a page. So,
  // really, there's no need for a magicNumber.
  //
  // None-the-less, I'm going to leave this in the code, commented out for now
  // just in case there are some un-intended consequences in the future.
  //
  // But really, I have no idea why this is here in the first place :/
  //
  // Add in variable height els
  // options.magicNumber -= $('header').outerHeight();
  // options.magicNumber -= $('.order-info').outerHeight();
  // options.magicNumber -= $('.order-adjustment').outerHeight();

  adjustPage( $('.page'), function(){
    window.__page.ready();
  });

  setTimeout( function(){
    if ( !window.__page.isReady() ) window.__page.ready();
  }, options.readyTimeout );
});