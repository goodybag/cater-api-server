/**
 * Receipt
 */

var options = {
  // Describes when to break the page
  magicNumber: 1460

  // Used to select the elements in a $page that will determine
  // the innerHeight of the element (since page is has a min-height),
  // we need to figure out $page.height() - inner.height()
, remainingTableHeightSelector: [
    '> :not(.order)'
  , '.order > :not(.order-bottom-wrapper)'
  , '.order-bottom-wrapper > *'
  ].join(', ')
};

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

(function(){

  var fillRemainingTrs = function( $page ){
    // Each blank table row should be:
    var rowHeight = 20;

    // Amount of space to be filled in page
    var remaining = $page.height() - Array.prototype.reduce.call(
      $page.find( options.remainingTableHeightSelector ).map( function(){
        return $(this).height();
      })
    , function( a, b ){ return a + b; }
    );

    console.print(
      "Page Height:", $page.height(),
      "Inner Height:",  Array.prototype.reduce.call(
          $page.find( options.remainingTableHeightSelector ).map( function(){
            return $(this).height();
          })
        , function( a, b ){ return a + b; }
        ),
      "Remaining height:", remaining,
      "Iterations:", ~~(remaining / rowHeight)
    );

    // console.print(
    //   options.remainingTableHeightSelector.split(', ').map( function( selector ){
    //     return ' ' + selector + ': ' + Array.prototype.reduce.call(
    //       $page.find( selector ).map( function(){
    //         return $(this).height() || 0;
    //       })
    //     , function( a, b ){ return a + b; }
    //     );
    //   })
    // );

    var $table = $page.find('table');
    var colspan = $table.find('th').length;

    // Insert remaining / rowHeight number of rows
    for ( var i = 0; i < ~~(remaining / rowHeight); ++i ){
      $table.find('tbody').append(
        '<tr><td colspan="' + colspan + '" style="height: ' + rowHeight + 'px"></td></tr>'
      );
    }
  };

  $(function(){
    // Order adjustments height is variable, so factor that chit in
    options.magicNumber += $('.order-adjustment').height();

    // Recursively adjust and add new pages
    var adjustPage = function( $page ){
      if ( $page.height() <= options.magicNumber ){
        // fillRemainingTrs( $page );
        return;
      }

      var $nextPage = $page.clone();
      $nextPage.find('table tbody tr').remove();
      $page.find('.order-bottom-wrapper, footer').remove();

      // Pop TR's from $page until magic number is met
      // Populate $nextPage with those TR's
      var $trs = $();
      while ( $page.height() > options.magicNumber ){
        $trs = $trs.add( $page.find('tbody > tr:last-child' ).clone() );
        $page.find('tbody > tr:last-child' ).remove();
      }

      $nextPage.find('tbody').append( $trs );
      $page.after( $nextPage );

      return adjustPage( $nextPage );
    };

    adjustPage( $('.page') );

    window.__page.ready();
  });
})();
