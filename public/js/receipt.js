/**
 * Receipt
 */

(function(){
  var options = {
    magicNumber: 400
  };

  $(function(){
    $('body').append(
      '<div style="position: absolute; background:#f0f;font-size:24px">' + $(document).height() + '</div>'
    );
    // First check to see if we even need to do anything

    // var $table = $('body > .page:first-child .order-table');

    // if ( $table.height() <= options.magicNumber ) return;

    // // Ok, we do need to do something. Pop all of the TR's out of table
    // // until we've satisfied our magicNumber
    // var $trs = $(), $tr;

    // while ( $table.height() <= options.magicNumber ){
    //   $tr = $table.find('tr:last-child');
    //   $trs = $trs.add( $tr.clone() );
    //   $tr.remove();
    // }
  });
})();
