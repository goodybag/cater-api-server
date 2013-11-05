var util = require('util');
var db  = require('../db');
var utils = require('../utils');
var Model = require('./model');
var Address = require('./address');

var table = 'users';


module.exports = Model.extend({

}, {
  table: table

  // Get foreign data source pivoting on users
, embeds: {
    addresses: function( addressQuery, query, callback, client ){
      Address.find( addressQuery, callback, client );
    }

  , payment_methods: function( pmQuery, query, callback, client ){
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
      , where: utils.extend( { 'upm.user_id': query.where.id }, pmQuery.where )
      };

      // Shallow query extension
      for ( var key in pmQuery ){
        if ( key === 'where' ) continue;
        query[ key ] = pmQuery[ key ];
      }

      (client || db).query( db.builder.sql( query ), function( error, result ){
        // Specify exactly two arguments to callback so it doesn't mess up async.parallel results
        return callback( error, result );
      });
    }
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
