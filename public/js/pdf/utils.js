// PhantomJS script periodically calls __page.isReady()
// When it returns true, the script renders the PDF and exits
window.__page = (function(){
  var exports = {};
  var isReady = false;

  exports.ready = function(){
    setTimeout( function(){ isReady = true; }, 1 );
  };

  exports.isReady = function(){
    return isReady;
  };

  return exports;
})();

console.print = function(){
  // Comment me if you want to live
  return console.log.apply( console, arguments );

  var $console = $('#console-print');
  if ( $console.length === 0 ){
    $console = $([
      '<div id="console-print" style="'
    , '  position: absolute;'
    , '  top: 10px;'
    , '  left: 0;'
    , '  z-index: 1000;'
    , '  padding: 12px;'
    , '  box-sizing: border-box;'
    , '  width: 100%;'
    , '  background: rgba(180, 180, 180, 0.5);'
    , '  font-family: monospace;'
    , '  font-size: 14px'
    , '"></div>'
    ].join(''));

    $('body').prepend( $console );
  }

  var args = Array.prototype.slice.call( arguments ).join(' ');

  $console.append(
    [
      '<div class="print-log-item" style="'
    , '  margin: 4px 0;'
    , '  padding: 4px;'
    , '  background-color: rgba(250, 250, 250, 0.8)'
    , '">'
    , args
    , '</div>'
    ].join('')
  );
};

var addPageRuler = function( $page ){
  var tmpl = '<div style="position: absolute; color: red; font-size: 18px; background: rgba(100, 20, 20, 0.1); left: 0; top: {top}px">{top}px</div>';
  $page.css('position', 'relative');
  for ( var i = 0, h = $page.outerHeight(); i < h; i += 100 ){
    $page.append( tmpl.replace(/\{top\}/g, i * 100 ) );
  }
};

// Recursively adjust and add new pages
var adjustPage = function( $page, options, callback ){
  var defaults = {
    pageHeight: 920

  , onPageClone: function( $page, $clone ){

    }

  , getPageHeight: function( $page ){
      return $page.outerHeight();
    }

  , onPageAdjustment: function( $page, $next ){

    }
  };

  for ( var key in defaults ){
    if ( !(key in options) ){
      options[ key ] = defaults[ key ];
    }
  }

  var lastItemChild = options.itemSelector + ':last-child';

  if ( $page.find( options.itemSelector ).length === 0 ){
    options.onPageAdjustment( $page );
    return callback();
  }
  
  if ( options.getPageHeight( $page ) <= options.pageHeight ){
    options.onPageAdjustment( $page );
    return callback();
  }

  var $nextPage = $page.clone();
  $nextPage.find( options.itemSelector ).remove();
  options.onPageClone( $page, $nextPage );

  // console.print("Page Outer Height:", options.getPageHeight( $page ));

  // Pop TR's from $page until page height is in the ideal range
  // Populate $nextPage with those TR's
  var $trs = $();

  var whileGreaterThan = function( next ){
    var outerHeight = options.getPageHeight( $page );
    console.print("  While Page Height: ", outerHeight, options.pageHeight );

    if ( outerHeight <= options.pageHeight ) return next();

    $trs = $trs.add( $page.find( lastItemChild  ).clone() );
    $page.find( lastItemChild  ).remove();

    setTimeout(function(){ whileGreaterThan( next ); }, 5 );
  };

  whileGreaterThan( function(){
    $nextPage.find('tbody').append( $trs.get().reverse() );
    $page.after( $nextPage );
    options.onPageAdjustment( $page );
    return adjustPage( $nextPage, options, callback );
  });
};