var util = require('util');
var utils = require('../utils');
var Model = require('./model');

var table = 'users';

// Coalesce two PG arrays for the JSON Array sub-select thingy
// Used to avoid results of the form `[null]`
var coalesceArray = function( table, col ){
  return  [
    'coalesce('
  , 'nullif( array_agg('
  , '"' + table + '"."' + col + '"'
  , ')::text[]'
  , ', array[null]::text[]'
  , '), array[]::text[]'
  , ')::json[]'
  ].join(' ');
};

module.exports = Model.extend({

}, {
  table: table

  // If you want to add a join to query, simply pass an array of strings
  // on the `embed` key in the query object. The values should match a
  // key inside this joins object
, joins: {
    // Adds payment_methods JSON array to user object
    'payment_methods': function( options, query ){
      // Add new `with` query replicating the base set
      if ( !query.withs ) query.withs = [];

      var localTable = {
        name: 'payment_methods_' + this.table
      , table: this.table
      , columns: ['id']
      , where: query.where
      };

      query.withs.push( localTable );

      query.columns.push({
        type: 'array_to_json'
      , as: 'payment_methods'
      , expression: coalesceArray( 'pms', 'pm' )
      });

      var joinSubSelect = utils.extend({
        type: 'select'
      , table: 'users_payment_methods'
      , columns: [
          'user_id'
        , { type: 'row_to_json', expression: 'payment_methods', as: 'pm' }
        ]
        // Join payment_methods
      , joins: {
          'payment_methods': {
            target: 'payment_methods'
          , on: { 'id': '$users_payment_methods.payment_method_id$' }
          }
        }
      }, options );

      query.joins.push({
        type:   'left'
      , alias:  'pms'
      , target: joinSubSelect
      , on: { 'pms.user_id': '$' + localTable.name + '.id$' }
      });

      if ( !query.groupBy ) query.groupBy = [];

      // Ensure we're grouping by user_id
      if ( query.groupBy.indexOf('users.id') === -1 ){
        query.groupBy.push('users.id');
      }
    }

  , 'addresses': function( options, query ){
      query.columns.push({
        type: 'array_to_json'
      , as: 'addresses'
      , expression: coalesceArray( 'addresses', 'address' )
      });

      query.joins.push({
        type: 'left'
      , alias: 'addresses'
      , on: { 'user_id': '$users.id$' }
      , target: utils.extend({
          type: 'select'
        , table: 'addresses'
        , columns: [
            'user_id'
          , { type: 'row_to_json', expression: 'addresses', as: 'address' }
          ]
        }, options )
      });

      if ( !query.groupBy ) query.groupBy = [];

      // Ensure we're grouping by user_id
      if ( query.groupBy.indexOf('users.id') === -1 ){
        query.groupBy.push('users.id');
      }
    }
  }

, join: function( tbl, options, query ){
    if ( !(tbl in this.joins) ) return this;

    if ( !query.joins ) query.joins = [];
    else if ( !Array.isArray( query.joins ) ) query.joins = [ query.joins ];

    if ( !query.columns ) query.columns = ['*'];

    return this.joins[ tbl ].call( this, options, query );
  }

, find: function( query, callback, client ){
    // Auto-joins
    if ( Array.isArray( query.embeds ) ){
      for ( var i = 0, l = query.embeds.length; i < l; ++i ){
        if ( typeof query.embeds[i] === 'string' ){
          this.join( query.embeds[i], null, query );
        } else {
          this.join( query.embeds[i].table, query.embeds[i].options, query );
        }
      }

      for ( var tbl in query.embed ){
        this.join( tbl, query.embed[ tbl ], query );
      }
    }
console.log(util.inspect(query, {depth: null}));
    return Model.find.call( this, query, callback, client );
  }
});
