/**
 * Order Manifester
 *
 * Takes an order items Array, and returns a manifest Array
 */

var utils = require('../utils');

module.exports.create = function( items ){
  var grouped = items.map( function( item ){
    var mitem = utils.pick( item, [
      'id', 'name', 'quantity', 'notes', 'item_id', 'sub_total', 'feeds_max'
    ]);

    mitem.recipients = item.recipient ? [ item.recipient ] : [];

    mitem.options_sets = item.options_sets
    .filter( function( set ) {
      return set.options.some( function( o ) {
        return o.state;
      });
    })
    .map( function( set ){
      var options = set.options.filter( function( o ){
        return o.state;
      });

      return {
        name:     set.name
      , options:  options
      }
    });

    return mitem;
  });

  grouped = utils.groupBy( grouped, 'item_id' );

  var itemsAreBasicallyTheSame = function( a, b ){
    if ( a.item_id !== b.item_id ) return false;
    if ( a.notes !== b.notes ) return false;
    if ( a.options_sets.length !== b.options_sets.length ) return false;

    for ( var i = 0, l = a.options_sets.length; i < l; i++ ){
      if ( a.options_sets[ i ].id !== b.options_sets[ i ].id ) return false;
      if ( a.options_sets[ i ].options.length !== b.options_sets[ i ].options.length ) return false;

      for ( var ii = 0, ll = a.options_sets[ i ].options.length; ii < ll; ii++ ){
        if ( a.options_sets[ i ].options[ ii ].name !== b.options_sets[ i ].options[ ii ].name ) return false;
      }
    }

    return true;
  };

  var consolidateGroup = function( group ){
    if ( group.length <= 1 ) return group;

    for ( var i = 1, l = group.length, g1, g2; i < l; i++ ){
      g1 = group[ i - 1 ];
      g2 = group[ i - 0 ];
      if ( !itemsAreBasicallyTheSame( g1, g2 ) ) continue;

      g1.quantity += g2.quantity;
      g1.sub_total += g2.sub_total;
      g1.recipients = g1.recipients.concat( g2.recipients );
      group.splice( i, 1 );

      // Since we removed group[i], do not advance `i`
      l--;
      i--;
    }

    return group;
  };

  Object.keys( grouped ).forEach( function( id ){
    grouped[ id ] = consolidateGroup( grouped[ id ] );
  });

  var manifest = Object.keys( grouped ).map( function( id ){
    return grouped[ id ];
  });

  manifest = utils.flatten( manifest );

  return manifest;
}
