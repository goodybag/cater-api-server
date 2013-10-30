var Model = require('./model');

var table = 'users';

module.exports = Model.extend({

}, {
  table: table

  // If you want to add a join to query, simply pass an array of strings
  // on the `embed` key in the query object. The values should match a
  // key inside this joins object
, joins: {
    // Adds payment_methods JSON array to user object
    'payment_methods': function( query ){
      query.columns.push({
        type: 'array_to_json'
      , expression: {
          type: 'array_agg'
        , expression: 'pms.pm'
        }
      });

      var joinSubSelect = {
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
      };

      query.joins.push({
        type:   'left'
      , alias:  'pms'
      , target: joinSubSelect
      , on: { 'pms.user_id': '$' + this.table + '.id$' }
      });

      if ( !query.groupBy ) query.groupBy = [];

      // Ensure we're grouping by user_id
      if ( query.groupBy.indexOf('users.id') === -1 ){
        query.groupBy.push('users.id');
      }
    }
  }

, join: function( tbl, query ){
    if ( !query.joins ) query.joins = [];
    else if ( !Array.isArray( query.joins ) ) query.joins = [ query.joins ];

    if ( !query.columns ) query.columns = ['*'];

    return this.joins[ tbl ].call( this, query );
  }

, find: function( query, callback, client ){
    // Auto-joins
    if ( Array.isArray( query.embed ) ){
      for ( var i = 0, l = query.embed.length; i < l; ++i ){
        this.join( query.embed[i], query );
      }
    }

    return Model.find.call( this, query, callback, client );
  }
});
