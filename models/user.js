var util = require('util');
var db  = require('../db');
var utils = require('../utils');
var Model = require('./model');
var Order = require('./order');
var Address = require('./address');
var queries = require('../db/queries');
var config = require('../config');
var logger = require('./logger').create('User');

var table = 'users';

var User = module.exports = Model.extend({
  isGuest: function(){
    if ( !Array.isArray( this.attributes.groups ) ) return false;

    return this.attributes.groups.indexOf('guest') > -1;
  }

, isAdmin: function() {
    if ( !this.attributes ) return false;
    var groups = this.attributes.groups;
    return Array.isArray( groups ) && groups.indexOf('admin') > -1;
  }

, isRestaurant: function(rid) {
    if ( !this.attributes ) return false;
    return utils.contains(this.attributes.groups, 'restaurant') &&
           ( rid ? utils.contains(this.attributes.restaurant_ids, rid) : true );
  }

, createPaymentMethod: function( pm, callback, client ){
    User.createPaymentMethod( this.attributes.id, pm, callback, client );
    return this;
  }

, findPaymentMethods: function( pmQuery, callback, client ){
    User.findPaymentMethods( this.attributes.id, pmQuery, callback, client );
    return this;
  }

, updatePaymentMethods: function( where, update, callback, client ){
    User.updatePaymentMethods( this.attributes.id, where, udpate, callback, client );
    return this;
  }

, removePaymentMethods: function( where, callback, client ){
    User.removePaymentMethods( this.attributes.id, where, callback, client );
    return this;
  }

, removeUserPaymentMethod: function( cardId, callback, client ){
    User.removeUserPaymentMethod( this.attributes.id, cardId, callback, client );
    return this;
  }

, getPendingPoints: function( callback, client ){
    User.getPendingPoints( this.attributes.id, callback, client );
    return this;
  }

, getOrdersWithPendingPoints: function( options, callback, client ){
    User.getOrdersWithPendingPoints( this.attributes.id, options, callback, client );
    return this;
  }

, removePoints: function( points, callback, client ){
    User.removePoints( this.attributes.id, points, callback, client );
    return this;
  }

, create: function( callback, client ){
    var this_ = this;
    var attr = this.attributes;

    var flow = {
      encrypt: function( done ){
        utils.encryptPassword( attr.password, function (error, hash, salt) {
          done(error, hash, salt);
        });
      }

    , stripe: function( hash, salt, done ){
        utils.stripe.customers.create({
          email: attr.email.toLowerCase()
        , metadata: { name: attr.name }
        }, function(error, customer) {
          if ( error ) return done ( error );
          done( null, hash, customer.id );
        });
      }

    , create: function( hash, stripe_id, done ){
        var groups = attr.groups || ['client'];

        var userData = utils.extend( attr, {
          email:                  attr.email.toLowerCase()
        , password:               hash
        , stripe_id:              stripe_id
        });

        var query = queries.user.create(
          utils.omit( userData, ['groups', 'restaurant_ids'] )
        );

        var sql = db.builder.sql( query );

        db.query( sql.query, sql.values, function( error, results ){
          if (error) return done( error );

          utils.extend( this_.attributes, results[0] );

          return done( null, results[0], groups );
        });
      }

    , group: function( user, groups, done ){
        user.groups = utils.map( groups, function( group ){
          return { user_id: user.id, group: group };
        });

        var query = queries.user.setGroup( user.groups );
        var sql = db.builder.sql( query );

        db.query( sql.query, sql.values, function( error, results ){
          done( error, user );
        });
      }

    , restaurant: function( user, done ){
        if ( !utils.find( user.groups, { group: 'restaurant' })
          || !attr.restaurant_ids
          || attr.restaurant_ids.length <=0
          || isNaN( parseInt( attr.restaurant_ids[0] ) )
        ) return done(null);

        var query = queries.userRestaurant.create({
          user_id:        user.id
        , restaurant_id:  parseInt( attr.restaurant_ids[0] )
        });

        var sql = db.builder.sql( query );
        db.query( sql.query, sql.values, function( error, results ){
          done( error, user );
        });
      }
    }

    utils.async.waterfall([
      flow.encrypt
    , flow.stripe
    , flow.create
    , flow.group
    , flow.restaurant
    ], function( error, user ){
      if ( error ) return callback( error );

      for ( var key in user ){
        this_.attributes[ key ] = user[ key ];
      }

      callback( null, this_ );
    });
  },

  toJSON: function() {
    this.attributes.isAdmin = this.isAdmin();
    return Model.prototype.toJSON.call(this);
  }
}, {
  table: table

, ownerWritable: [
    'name'
  , 'organization'
  , 'organization_type'
  , 'email'
  , 'password'
  ]

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
    , returning: ['*']
    };

    // For some reason typeof (client || db) === 'undefined' but typeof db === 'object'.
    db.query( db.builder.sql( query ), function( error, result, info ){
      if ( error ) return callback( error );

      if ( pm.save_card == false ) return callback( null, result[0] );

      var id = result[0].id;

      var query = {
        type: 'insert'
      , table: 'users_payment_methods'
      , values: { user_id: userId, payment_method_id: id, name: pm.name }
      , returning: ['id']
      };

      db.query( db.builder.sql( query ), function( error, _result, info ){
        return callback( error, result[0] );
      });
    });
  }

, findPaymentMethods: function( userId, pmQuery, callback, client ){
    var query = {
      type: 'select'
    , table: 'payment_methods'
    , columns: ['payment_methods.*', 'upm.name']
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

    if ( 'data' in update ) update.data = JSON.stringify( update.data );

    // Don't override existing user_id queries
    if ( typeof where.id !== 'object' ){
      where.id = { $equals: where.id };
    }

    // Ensure that payment methods belong to user
    where.id.$in = {
      type: 'select'
    , table: 'users_payment_methods'
    , columns: ['payment_method_id']
    , where: { user_id: userId }
    };

    var query = {
      type: 'update'
    , table: 'payment_methods'
    , values: utils.pick( update, this.paymentMethodFields )
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

, removeUserPaymentMethod: function( userId, cardId, callback, client ) {
    var query = {
      type: 'delete'
    , table: 'users_payment_methods'
    , where: {
        payment_method_id: cardId
      , user_id: userId
      }
    , returning: ['*']
    };

    ( client || db ).query( db.builder.sql( query ), function( error, result, info ) {
      return callback( error, result );
    });
  }

, addPointsForOrder: function( order, callback, client ) {
    var points = order.attributes.points || 0;
    if (isNaN(points)) return callback(new Error('cannot calculate points for order'));

    db.getClient(function (error, client, done) {
      var tasks = {
        begin: function (cb) {
          client.query('BEGIN', cb);
        }
      , updateUserPoints: function (cb) {
          var query = {
            type: 'update'
          , table: 'users'
          , updates: {
              $inc: {points: points}
            }
          , where: {
              id: order.attributes.user_id
            }
          };

          var sql = db.builder.sql(query);
          client.query(sql.query, sql.values, cb);
        }
      , setPointsAwardedForOrder: function (cb) {
          var query = {
            type: 'update'
          , table: 'orders'
          , updates: {
              points_awarded: true
            }
          , where: {
              id: order.attributes.id
            , points_awarded: false
            }
          };
          var sql = db.builder.sql(query);
          client.query(sql.query, sql.values, cb);
        }
      };

      utils.async.series([
        tasks.begin
      , tasks.updateUserPoints
      , tasks.setPointsAwardedForOrder
      ], function (error, results) {
        client.query(error ? 'ROLLBACK' : 'COMMIT', function(e, rows, result) {
          done();
          return callback(e || error);
        });
      });
    });
  }

, removePoints: function( userId, points, callback, client ) {
    var query = {
      type: 'update'
    , table: 'users'
    , updates: {
        $dec: {points: points}
      }
    , where: {
        id: userId
      }
    };

    ( client || db ).query( db.builder.sql( query ), function( error, result, info ) {
      return callback( error, result );
    });
  }

, getPendingPoints: function( userId, callback, client ) {
    var query = {
      status: {$or: ['submitted', 'accepted', 'delivered']}
    , points_awarded: false
    , user_id: userId
    , created_at: { $gte: config.rewardsStartDate }
    };
    var options = { submittedDate: true };
    db.orders.find(query, options, function(error, orders){
      if (error) return callback(error);

      var points = 0;
      if (!orders.length) return callback(null, points);
      orders.forEach(function(order){
        points += (order.points || 0);
      });
      return callback(null, points);
    });
  }

, getOrdersWithPendingPoints: function( userId, options, callback, client ) {
    if ( typeof options === 'function' ){
      callback = options;
      client = callback;
      options = {};
    }

    var query = utils.defaults({
      where: {
        status: {$or: ['submitted', 'accepted', 'delivered']}
      , points_awarded: false
      , user_id: userId
      , created_at: { $gte: config.rewardsStartDate }
      }
    }, options);

    return Order.find(query, callback);
  }

, find: function( query, callback, client ){
    var this_ = this;

    if (!query.columns) query.columns = ['*'];
    if (!query.joins) query.joins = {};

    query.columns.push({
      type: 'array_agg',
      as: 'groups',
      expression: '"users_groups"."group"'
    });

    query.joins.users_groups = {
      type: 'left',
      on: {'user_id': '$users.id$'}
    };

    query.columns.push({
      type: 'array_agg',
      as: 'restaurant_ids',
      expression: '"users_restaurants"."restaurant_id"'
    });

    query.joins.users_restaurants = {
      type: 'left',
      on: {'user_id': '$users.id$'}
    };

    query.groupBy = 'id';

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

    logger.info('Running tasks', { tasks: Object.keys( tasks ) });

    utils.async.parallel( tasks, function( error, result ){
      logger.info('Complete', error, result );
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
