/**
 * Payment Summaries Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

var dirac = require('dirac');
var utils = require('../../utils');
var types = require('../data-types');

define(function(require) {
  var definition = {};
  definition.name = 'payment_summaries';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , payment_date: {
      type: types.timestamptz
    , default: 'NOW()'
    }
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {table: 'restaurants', column: 'id', onDelete: 'set null'}
    }
  , adjustment: {
      type: types.int
    , default: '0'
    }
  , adjustment_text: {
      type: types.text
    }
  , period_begin: { type: types.date, nullable: false }
  , period_end: { type: types.date, nullable: false }
  };

  definition.indices = {};

  definition.update = function update( $where, $update, options, callback ){
    // We should standardize this upstream with a convenience method
    if ( typeof options == 'function' ){
      callback = options;
      options = {};
    }

    if ( typeof $where != 'object' ) $where = { id: $where };

    if ( !$where.id ) return this._super( $where, $update, options, callback );
    if ( !Array.isArray( $update.items ) ) return this._super( $where, $update, options, callback );

    var tx = dirac.tx.create();

    var items = $update.items;
    delete $update.items;

    for ( var i = items.length - 1; i >= 0; i-- ){
      delete items[i].id;
      delete items[i].created_at;
      items[i].payment_summary_id = $where.id;
    }

    utils.async.series([
      tx.begin.bind( tx )
      // Remove items
    , tx.payment_summary_items.remove.bind(
        tx.payment_summary_items
      , { payment_summary_id: $where.id }
      )
      // Add items
    , items.length > 0
      ? tx.payment_summary_items.insert.bind(
          tx.payment_summary_items
        , items
        )
      : utils.async.noop
      // Update the original document
    , Object.keys( $update ).length > 0
      ? tx.payment_summaries.update.bind(
          tx.payment_summaries
        , $where
        , $update
        , options
        )
      : utils.async.noop
    , tx.commit.bind( tx )
    ], callback );
  };

  definition.insert = function( $doc, options, callback ){
    // We should standardize this upstream with a convenience method
    if ( typeof options == 'function' ){
      callback = options;
      options = {};
    }

    if ( !Array.isArray( $doc.items ) ) return this._super( $doc, options, callback );

    var items = $doc.items;
    delete $doc.items;

    if ( items.length === 0 ) return this._super( $doc, options, callback );

    utils.async.waterfall([
      dirac.dals.payment_summaries.insert.bind(
        dirac.dals.payment_summaries, $doc, options
      )

    , function( summary, next ){
        items.forEach( function( item ){
          item.payment_summary_id = summary.id;
        });

        dirac.dals.payment_summary_items.insert( items, { returning: ['*'] }, function( error, results ){
          if ( error ) return next( error );

          summary.items = results;

          return next( null, summary );
        });
      }
    ], callback );
  };

  return definition;
});
