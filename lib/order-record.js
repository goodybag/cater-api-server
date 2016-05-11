'use strict';
/**
 * Order Records
 */

var Address = require('stamps/addresses');
var DMReq = require('stamps/requests/distance-matrix');
var dirac = require('dirac');
var errors = require('../errors');
var moment = require('moment-timezone');

exports.generate = function( orderId, callback ){
  var options = {
    one:  [ { table: 'restaurants', alias: 'restaurant'
            , columns: ['*']
            , one:  [ { table: 'restaurant_plans', alias: 'plan' }
                    , { table: 'regions', alias: 'region' }
                    ]
            }
          , { table: 'users', alias: 'user' }
          , { table: 'restaurant_locations', alias: 'location' }
          , { table: 'payment_methods'
            , alias: 'payment_method'
            , columns: ['payment_methods.*', 'users_payment_methods.name']
            , joins:  [ { type: 'left'
                        , target: 'users_payment_methods'
                        , on: { 'payment_method_id': '$payment_methods.id$' }
                        }
                      ]
            }
          , { table: 'latest_order_revisions'
            , alias: 'previous_revision'
            , columns: ['latest_order_revisions.data']
            }
          ]
  , many: [ { table: 'order_items', alias: 'items' }
          , { table: 'order_amenities', alias: 'amenities'
            , mixin: [{ table: 'amenities' }]
            }
          ]
  };

  dirac.dals.orders.findOne( orderId, options, function( error, order ){
    if ( error ){
      return callback( error );
    }

    var original = order.previous_revision && order.previous_revision.data;
    delete order.previous_revision;

    var origin = Address( order.location || order.restaurant ).toString();
    var destination = Address( order ).toString();

    if ( original ) {
      var previousOrigin = Address( original.location || original.restaurant ).toString();
      var previousDestination = Address( original ).toString();
    }

    if ( origin !== previousOrigin || destination !== previousDestination ) {
      DMReq({
        origins: [origin],
        destinations: [destination],
        arrivalTime: moment.tz( order.datetime, order.timezone )
      }).send().then( function ( results ){
        var result = results[0].elements[0];

        if ( result.status in errors.google.distanceMatrix ){
          throw errors.google.distanceMatrix[ result.status ];
        }

        order.distance_estimates = {
          distance: result.distance
        , duration: result.duration
        };

        return order;
      }).nodeify( callback );
    } else {
      order.distance_estimates = original.distance_estimates;

      callback( null, order );
    }
  });
};
