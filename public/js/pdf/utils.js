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

$.fn.innerHeight = function( options ){
  return Array.prototype.reduce.call(
    this.find('> *').map( function(){
      if ( $(this).hasClass('order') ) return $(this).innerHeight();
      return $(this).outerHeight();
    })
  , function( a, b ){ return a + b; }
  );
};

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

// WIP progress function for filling the remaining Table Rows
// so the tables don't look so bare
// This isn't being used yet
var fillRemainingTrs = function( $page ){
  // Each blank table row should be:
  var rowHeight = 20;

  // Amount of space to be filled in page
  var remaining = $page.outerHeight() - Array.prototype.reduce.call(
    $page.find( options.remainingTableHeightSelector ).map( function(){
      return $(this).outerHeight();
    })
  , function( a, b ){ return a + b; }
  );

  console.print(
    "Page Height:", $page.outerHeight(),
    "Inner Height:",  Array.prototype.reduce.call(
        $page.find( options.remainingTableHeightSelector ).map( function(){
          return $(this).outerHeight();
        })
      , function( a, b ){ return a + b; }
      ),
    "Remaining height:", remaining,
    "Iterations:", ~~(remaining / rowHeight)
  );

  var $table = $page.find('table');
  var colspan = $table.find('th').length;

  // Insert remaining / rowHeight number of rows
  for ( var i = 0; i < ~~(remaining / rowHeight); ++i ){
    $table.find('tbody').append(
      '<tr><td colspan="' + colspan + '" style="height: ' + rowHeight + 'px"></td></tr>'
    );
  }
};

var addPageRuler = function( $page ){
  var tmpl = '<div style="position: absolute; color: red; font-size: 18px; background: rgba(100, 20, 20, 0.1); left: 0; top: {top}px">{top}px</div>';
  $page.css('position', 'relative');
  for ( var i = 0, h = $page.outerHeight(); i < h; i += 100 ){
    $page.append( tmpl.replace(/\{top\}/g, i * 100 ) );
  }
};

// Recursively adjust and add new pages
var adjustPage = function( $page, callback ){
  if ( $page.find('table tbody tr').length === 0 ) return callback();
  if ( $page.outerHeight() <= options.magicNumber ) return callback();

  var $nextPage = $page.clone();
  $nextPage.find('table tbody tr').remove();
  $page.find('.order-bottom-wrapper').remove();

  // console.print("Page Outer Height:", $page.outerHeight(), "Magic Number:", options.magicNumber);

  // Pop TR's from $page until magic number is met
  // Populate $nextPage with those TR's
  var $trs = $();

  var whileGreaterThan = function( next ){
    var outerHeight = $page.outerHeight();
    console.print("  While Page Height: ", outerHeight, options.magicNumber );

    if ( outerHeight <= options.magicNumber ) return next();

    $trs = $trs.add( $page.find('tbody > tr:last-child' ).clone() );
    $page.find('tbody > tr:last-child' ).remove();

    setTimeout(function(){ whileGreaterThan( next ); }, 5 );
  };

  whileGreaterThan( function(){
    $nextPage.find('tbody').append( $trs.get().reverse() );
    $page.after( $nextPage );
    return adjustPage( $nextPage, callback );
  });
};