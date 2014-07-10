// The tray is composed of menu items and optional sub-items.
// A single menu item's format is:
//  [menu item id]/[qty],[option id],[option id]...
// Multiple menu items are joined by a +:
//  [menu item id]/[qty]+[menu item id2]/[qty2]
// For example:
//  3270/2+3263/1,3279
// Means 2 of menu item 3270 (with no sub options) and 1 of item
// num 3263 with sub option 3279.

// Return the ids of valid item options
function getOptionIds( options, group ){
  var ids = group.options
              .filter( function ( option ) { return option.state; })
              .map( function ( option ) { return option.hackfood_item_id; });
  return options.concat( ids );
}

// Parse order.item into ordr.in item format
// e.g. id/qty,option,option,option
function mapTrayItems( item ){
  var output = [ item.hackfood_item_id + '/' + (item.quantity || 1) ];

  if ( Array.isArray( item.options_sets ) ) {
    output = output.concat( item.options_sets.reduce( getOptionIds, [] ) );
  }

  return output.join(',');
}

// Returns a string in the ordr.in tray format
module.exports = function( order ){
  return order.items.map( mapTrayItems ).join('+');
}