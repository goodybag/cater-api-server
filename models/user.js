var Model = require('./model');

var table = 'users';

module.exports = Model.extend({
  joins: {
    // Adds payment_methods JSON array to user object
    'payment_methods': function( query ){
      var joinSubSelect = {
        type: 'select'
      , table: 'users_payment_methods'
      , columns: [
          'user_id'
        , { type: 'row_to_json', expression: 'payment_methods' }
        ]
        // Join payment_methods
      , joins: {
          'payment_methods': {
            on: { 'id': '$users_payment_methods.payment_method_id$' }
          }
        }
      };

      query.joins.push({
        type:   'left'
      , alias:  'pms'
      , target: joinSubSelect
      , on: { 'pm.user_id': '$' + users + '.id$' }
      });

      if ( !query.groupBy ) query.groupBy = [];

      // Ensure we're grouping by user_id
      if ( query.groupId.indexOf('users.id') === -1 ){
        query.groupBy.push('users.id');
      }
    }
  }

, find: function( query, callback, client ){
    // Auto-joins
    if ( Array.isArray( query.joins ) ){
      for ( var i = 0, l = query.joins.length; i < l; ++i ){
        if ( typeof query.joins[i] !== 'string' ) continue;

        query.joins[i] = this.join( query.joins[i], query );
      }
    }

    return Model.find.call( this, query, callback, client );
  }

, join: function( tbl, query ){
    if ( !query.columns ) query.columns = ['*'];

    this.joins[ tbl ].call( this, query );

    return this;
  }
}, { table: table });
