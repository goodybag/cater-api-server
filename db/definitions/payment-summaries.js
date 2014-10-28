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
      items[i].payment_summary_id = $where.id;
    }

    utils.async.series([
      tx.begin.bind( tx )
      // Remove items
    , utils.async.log('remove')
    , tx.payment_summary_items.remove.bind(
        tx.payment_summary_items
      , { payment_summary_id: $where.id }
      )
      // Add items
    , utils.async.log('add/noop')
    , items.length > 0
      ? tx.payment_summary_items.insert.bind(
          tx.payment_summary_items
        , items
        )
      : utils.async.noop
      // Update the original document
    , utils.async.log('update')
    , Object.keys( $update ).length > 0
      ? tx.payment_summaries.update.bind(
          tx.payment_summaries
        , $where
        , $update
        , options
        )
      : utils.async.noop
    , utils.async.log('commit')
    , tx.commit.bind( tx )
    ], callback );
  };

  // Insert with items as a transaction
  // This function is a bit funky since if they specify .items, then
  // the top-level query is actually inserting on `payment_summary_items`
  // Options would then apply to _that_ query, whereas if .items is not
  // specified, then the top-level query is as expected.
  // I didn't go the transaction route because I needed to use the ID
  // from the `payment_summary` insert.
  //
  // Don't specify function name so we don't run before filters on insert
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

    var idSelect = {
      type: 'select'
    , table: 'summary'
    , columns: ['id']
    };

    for ( var i = items.length - 1; i >= 0; i-- ){
      items[ i ].payment_summary_id = idSelect;
    }

    var $query = utils.extend({
      type: 'insert'
    , table: 'payment_summary_items'
    , with: {
        summary: {
          type:       'insert'
        , table:      'payment_summaries'
        , values:     $doc
        , returning:  ['*']
        }
      }
    , values: items
    }, options, {
      // Always use our returning
      // Cannot return all columns, only id - better than nothing
      returning: [ idSelect ]
    });

    utils.async.series([
      dirac.dals.payment_summary_items.runBeforeFilters.bind(
        dirac.dals.payment_summary_items, 'insert', $query
      )
    , dirac.dals.payment_summaries.runBeforeFilters.bind(
        dirac.dals.payment_summaries, 'insert', $query.with.summary
      )
    , this.query.bind( this, $query, callback )
    ], callback );
  };

  return definition;
});
