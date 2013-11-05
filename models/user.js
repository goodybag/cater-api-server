var util = require('util');
var db  = require('../db');
var utils = require('../utils');
var Model = require('./model');
var Address = require('./address');

var table = 'users';

module.exports = Model.extend({
  createPaymentMethod: function( pm, callback, client ){
    module.exports.createPaymentMethod( this.attributes.id, pm, callback, client );
    return this;
  }

, findPaymentMethods: function( pmQuery, callback, client ){
    module.exports.findPaymentMethods( this.attributes.id, pmQuery, callback, client );
    return this;
  }

, updatePaymentMethods: function( where, update, callback, client ){
    module.exports.updatePaymentMethods( this.attributes.id, where, udpate, callback, client );
    return this;
  }

, removePaymentMethods: function( where, callback, client ){
    module.exports.removePaymentMethods( this.attributes.id, where, callback, client );
    return this;
  }
}, {
  table: table

  // Get foreign data source pivoting on users
, embeds: {
    addresses: function( addressQuery, originalQuery, callback, client ){
      return Address.find( addressQuery, callback, client );
    }

  , payment_methods: function( pmQuery, originalQuery, callback, client ){
      return this.findPaymentMethods( originalQuery.where.id, pmQuery, callback, client );
    }
  }

, paymentMethodFields: Object.keys(
    require('../db/definitions/payment-methods').schema
  )

, createPaymentMethod: function( userId, pm, callback, client ){
    if ( 'data' in pm ) pm.data = JSON.stringify( pm.data );

    // Techncially, this should be in a transaction
    var query = {
      type: 'insert'
    , table: 'payment_methods'
    , values: utils.pick( pm, this.paymentMethodFields )
    , returning: ['id']
    };
console.log(client, typeof (client || db).query)
    db.query( db.builder.sql( query ), function( error, result, info ){
      console.log("#############", error)
      if ( error ) return callback( error );

      var id = result[0].id;

      var query = {
        type: 'insert'
      , table: 'users_payment_methods'
      , values: { user_id: userId, payment_method_id: id }
      , returning: ['id']
      };
console.log("ohai")
      db.query( db.builder.sql( query ), function( error, result, info ){
        return callback( error, result );
      });
    });
  }

, findPaymentMethods: function( userId, pmQuery, callback, client ){
    var query = {
      type: 'select'
    , table: 'payment_methods'
    , columns: ['payment_methods.*']
    , joins: {
        users_payment_methods: {
          alias: 'upm'
        , on: { 'payment_method_id': '$payment_methods.id$' }
        }
      }
    , where: utils.extend( { 'upm.user_id': userId }, pmQuery.where )
    };

    // Shallow query extension
    for ( var key in pmQuery ){
      if ( key === 'where' ) continue;
      query[ key ] = pmQuery[ key ];
    }

    ( client || db ).query( db.builder.sql( query ), function( error, result, info ){
      return callback( error, result );
    });
  }

, updatePaymentMethods: function( userId, where, update, callback, client ){
    if ( ['number', 'string'].indexOf( typeof where ) > -1 ){
      where = {
        id: { $equals: where }
      };
    }

    // Don't override existing user_id queries
    if ( typeof where.id !== 'object' ){
      where.id = { $equals: where.id };
    }

    // Ensure that payment methods belong to user
    where.id.$in = {
      type: 'select'
    , columns: ['payment_method_id']
    , where: { user_id: userId }
    };

    var query = {
      type: 'update'
    , table: 'payment_methods'
    , where: where
    , returning: ['*']
    };

    ( client || db ).query( db.builder.sql( query ), function( error, result, info ){
      return callback( error, result );
    });
  }

, removePaymentMethods: function( userId, where, callback, client ){
    if ( ['number', 'string'].indexOf( typeof where ) > -1 ){
      where = {
        id: { $equals: where }
      };
    }

    // Don't override existing user_id queries
    if ( typeof where.id !== 'object' ){
      where.id = { $equals: where.id };
    }

    // Ensure that payment methods belong to user
    where.id.$in = {
      type: 'select'
    , columns: ['payment_method_id']
    , where: { user_id: userId }
    };

    var query = {
      type: 'delete'
    , table: 'payment_methods'
    , where: where
    , returning: ['*']
    };

    ( client || db ).query( db.builder.sql( query ), function( error, result, info ){
      return callback( error, result );
    });
  }

, find: function( query, callback, client ){
    var this_ = this;

    // Run all tasks in parallel
    var tasks = {
      users: function( done ){
        return Model.find.call( this_, query, done, client );
      }
    };

    // Is the user requesting to embed foreign data?
    // If so, add the embed functions to tasks
    if ( utils.isObject( query.embeds ) ){
      Object.keys( query.embeds ).forEach( function( key ){
        if ( !(key in this_.embeds) ) return;

        tasks[ key ] = function( done ){
          this_.embeds[ key ].call( this_, query.embeds[ key ], query, done );
        };
      });
    }

    utils.async.parallel( tasks, function( error, result ){
      if ( error ) return callback( error );

      // Embed the results into the user objects invoking toJSON on sub-models
      for ( var key in result ){
        if ( key === 'users' ) continue;

        result.users.forEach( function( user ){
          if ( 'toJSON' in result[ key ] ){
            user.attributes[ key ] = utils.invoke( result[ key ], 'toJSON' );
          } else {
            user.attributes[ key ] = result[ key ];
          }
        });
      }

      return callback( null, result.users );
    });
  }
});
