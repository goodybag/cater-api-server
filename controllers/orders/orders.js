'use strict';

var db      = require('../../db');
var errors  = require('../../errors');
var utils   = require('../../utils');
var config  = require('../../config');
var states  = require('../../public/js/lib/states')
var models  = require('../../models');
var venter  = require('../../lib/venter');
var pdfs    = require('../../lib/pdfs');
var scheduler = require('../../lib/scheduler');

var moment = require('moment-timezone');
var twilio = require('twilio')(config.twilio.account, config.twilio.token);
var Mailgun = require('mailgun').Mailgun;
var MailComposer = require('mailcomposer').MailComposer;
var orderDefinitionSchema = require('../../db/definitions/orders').schema;
var promoConfig = require('../../configs/promo');
var DMReq = require('stamps/requests/distance-matrix');
var deliveryFee = require('stamps/orders/delivery-fee');
var Address = require('stamps/addresses');
var UserAddresses = require('stamps/addresses/user-addresses-db');
var GeocodeRequest = require('stamps/requests/geocode');
var Order = require('stamps/orders/base');
var OrderFulfillability = require('stamps/orders/fulfillability');
var odsChecker = require('order-delivery-service-checker');

var addressFields = [
  'street'
, 'street2'
, 'city'
, 'state'
, 'zip'
, 'phone'
, 'delivery_instructions'
];

/**
 * Will attach req.order and req.order[isOwner, isRestaurantManager, isAdmin] to help determine
 * what control the user has over a particular order
 */
module.exports.auth = function(req, res, next) {
  var logger = req.logger.create('Middleware-OrderAuth');
  logger.info('auth for order #%s', req.order.id);

  if ( req.user != null && utils.contains(req.user.attributes.groups, 'admin') ){
    req.order.isAdmin = true;
    return next();
  }

  var reviewToken = req.body.review_token || req.query.review_token;
  if (req.body.review_token) delete req.body.review_token;

  // There was a review token, so this is a restaurant
  if ( reviewToken && (reviewToken === req.order.review_token) ){
    req.order.isRestaurantManager = true;
    req.user.attributes.groups.push('restaurant');
    req.user.attributes.groups.push('order-restaurant');
  }

  if ( req.user && req.user.attributes && req.user.attributes.id === req.order.user_id ){
    req.user.attributes.groups.push('order-owner');
    req.order.isOwner = true;
  }

  logger.info('checking guest status');
  if ( req.user.isGuest() ){
    if ( Array.isArray( req.session.guestOrders ) ){
      logger.info('guest orders is available');
      if ( req.session.guestOrders.indexOf( req.order.id ) > -1 ){
        req.user.attributes.groups.push('order-owner');
        req.order.isOwner = true;
      }
    }
  }

  logger.info('user permissions [' + req.user.attributes.groups.join(', ') + ']');
  next();
};

module.exports.editability = function(req, res, next) {
  // ensure only tip fields are being adjusted
  var isTipEdit = (req.order.isOwner || req.order.isRestaurantManager) &&
                  !utils.difference(utils.keys(req.body), ['tip', 'tip_percent']).length;
  var editable = isTipEdit || req.order.isAdmin || utils.contains(['pending', 'submitted'], req.order.status);
  return editable ? next() : res.json(403, 'order not editable');
};

module.exports.get = function(req, res) {
  var logger = req.logger.create('Controller-Get');
  var order = req.order;
  // Save this for later when we're informing the legacy models
  // how to not be dumb
  var orderRestaurant = order.restaurant;
  var amenities = order.restaurant.amenities;
  var orderModel = new models.Order( order );

  // Redirect empty orders to item summary
  if (!order.orderItems.length) return res.redirect(302, '/orders/' + req.params.oid + '/items');

  var isReview = order.status === 'submitted'
    && (req.query.review_token === order.review_token || req.order.isRestaurantManager)
  ;

  // Require guests to signup
  if ( req.user.isGuest() && !req.user.isRestaurant() ){
    req.session.user.currentOrder = req.order;

    return res.redirect( '/join' + utils.queryParams({
      next: '/orders/' + req.order.id
    , fromGuestOrder: true
    }));
  }

  if ( req.user.isRestaurant() ){
    return res.render( 'order-restaurant', {
      layout: 'layout/default'
    , order: order
    });
  }

  utils.async.waterfall([
    // Can't yet rely on order.restaurant to have all of the right info
    // in the legacy formats
    orderModel.getRestaurant.bind( orderModel )
  ], function( error, restaurant ){
    if ( error ){
      return res.error(errors.internal.DB_FAILURE, error);
    }

    // order.restaurant is mutated by order.getRestaurant
    // Hack: re-attach amenities object back to restaurant
    order.restaurant.amenities = amenities;

    utils.findWhere(states, {abbr: order.state || 'TX'}).default = true;
    var context = {
      order: order,
      isRestaurantReview: isReview,
      isOwner: req.order.isOwner,
      isRestaurantManager: req.order.isRestaurantManager,
      isAdmin: req.order.isAdmin,
      isTipEditable: orderModel.isTipEditable({
        isOwner: req.order.isOwner,
        isRestaurantManager: req.order.isRestaurantManager,
        isAdmin: req.order.isAdmin,
      }),
      show_pickup: req.order.type === 'pickup' || (req.order.isRestaurantManager && req.order.type === 'courier'),
      states: states,
      orderAddress: {
        address: utils.extend( {}, order, { name: order.address_name } ),
        states: states
      },
      orderParams: req.session.orderParams,
      query: req.query,
      step: order.status === 'pending' ? 2 : 3
    };

    // Put address grouped on order for convenience
    context.order.address = utils.pick(
      context.order,
      ['street', 'street2', 'city', 'state', 'zip', 'phone', 'notes']
    );

    // Decide where to show the `Thanks` message
    // only displays one hour after the order has been submitted.
    if (moment(context.order.submitted).isAfter(moment().subtract(1, 'h')) )
    if (req.user)
    if (context.order.user_id == req.user.attributes.id){
      context.showThankYou = true;
    }

    // don't allow restaurant manager to edit orders
    // in the future we will/should support this
    if (req.order.isRestaurantManager)
      context.order.editable = false;

    var view = order.status === 'pending' ? 'checkout' : 'receipt';

    if ( context.order.review_token !== req.query.review_token ) {
      delete context.order.review_token;
    }

    // Inform the legacy models to use new fulfillability logic
    context.order.restaurant._cached = orderRestaurant;

    res.render(view, context);
  });
};

module.exports.create = function(req, res, next) {
  var order = new models.Order(
    utils.extend({
      user_id: req.user.attributes.user ? req.user.attributes.user.id : null
    }, req.body)
  );

  order.save(function(err) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    if ( req.user.isGuest() ){
      if ( !req.session.guestOrders ){
        req.session.guestOrders = [];
      }

      req.session.guestOrders.push( order.attributes.id );
    }

    db.order_types.insert({
      order_id: order.attributes.id
    , user_id:  order.attributes.user_id
    , type:     order.attributes.type
    },
    function( err ){
      if ( err ) return res.error(errors.internal.DB_FAILURE, err);

      req.session.save( function(){
        res.send(201, order.toJSON());
      });
    });

    db.order_revisions.track( order.attributes.id, req.user.attributes.id, 'create', function( error ){
      if ( error ){
        req.logger.warn('Error tracking order revision', {
          order: { id: order.attributes.id }
        , error: error
        });
      }
    });
  });
};

module.exports.apiCreate = function(req, res, next) {
  var order = new models.Order(
    utils.extend({
      user_id: req.user.attributes.user ? req.user.attributes.user.id : null
    , sub_total: 0
    }, req.body)
  );

  if ( req.body.restaurant_id ){
    var restaurant = db.cache.restaurants.byId( req.body.restaurant_id );

    if ( restaurant ){
      // We need a POJO version of the order that has the restaurant
      // added to it so we can check things like fulfillability and
      // the Order Delivery Service Criteria Checker
      let orderWithRestaurant = utils.extend( {}, order.attributes, {
        restaurant: restaurant
      , timezone: restaurant.region.timezone
      });

      // Determine whether or not the order should
      order.attributes.type = orderWithRestaurant.type = odsChecker.check(
        orderWithRestaurant
      ) ? 'courier' : 'delivery';

      let result = OrderFulfillability
        .create( orderWithRestaurant )
        .why();

      if ( Array.isArray( result ) && result.length ){
        let error = utils.clone( errors.input.FULFILLABILITY_FAILED );
        error.details = result;
        return next( error );
      }
    }
  }

  order.save(function(err) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    if ( req.user.isGuest() ){
      if ( !req.session.guestOrders ){
        req.session.guestOrders = [];
      }

      req.session.guestOrders.push( order.attributes.id );
    }

    db.order_types.insert({
      order_id: order.attributes.id
    , user_id:  order.attributes.user_id
    , type:     order.attributes.type
    },
    function( err ){
      if ( err ) return res.error(errors.internal.DB_FAILURE, err);

      req.session.save( function(){
        var result = order.toJSON();
        result.restaurant = db.cache.restaurants.byId( +result.restaurant_id );
        result.deadline = Order.fixed.methods.getDeadline.call( result );
        delete result.restaurant;

        res.send(201, result);
      });
    });

    db.order_revisions.track( order.attributes.id, req.user.attributes.id, 'create', function( error ){
      if ( error ){
        req.logger.warn('Error tracking order revision', {
          order: { id: order.attributes.id }
        , error: error
        });
      }
    });
  });
};

module.exports.update = function(req, res, next) {
  var logger = req.logger.create('Controller-Update');

  // get keys from order def schema that allow editable access
  var updateableFields = Object.keys( orderDefinitionSchema ).filter( function( key ){
    return req.user.attributes.groups.some( function( group ){
      if ( !Array.isArray( orderDefinitionSchema[ key ].editable ) ){
        return true;
      }

      return utils.contains( orderDefinitionSchema[ key ].editable, group );
    });
  });

  var restaurantUpdateableFields = ['tip', 'tip_percent', 'reason_denied'];
  if (req.order.isRestaurantManager) updateableFields = restaurantUpdateableFields;

  // Instantiate order model for save functionality
  var order = new models.Order(req.order);

  var datetimeChanged = req.body.datetime && order.attributes.datetime !== req.body.datetime;
  var oldDatetime = order.attributes.datetime;
  var oldType = order.attributes.type;
  var oldPaymentStatus = order.attributes.payment_status;

  var isTipEditable = order.isTipEditable({
    isOwner: req.order.isOwner,
    isRestaurantManager: req.order.isRestaurantManager,
    isAdmin: req.order.isAdmin,
  });

  if (!isTipEditable) updateableFields = utils.without(updateableFields, 'tip', 'tip_percent');

  utils.extend(order.attributes, utils.pick(req.body, updateableFields));

  utils.async.series([
    // Geocode the address on the order if necessary
    function( next ){
      var bodyAddress = Address( req.body );

      // No address info, no need to geocode
      if ( bodyAddress.fulfilledComponents().length === 0 ){
        return next();
      }

      if ( !req.body.street ){
        return next();
      }

      var orderAddress = Address( order.attributes );

      if ( !orderAddress.hasMinimumComponents() ){
        return next();
      }

      GeocodeRequest()
        .address( orderAddress.toString({ street2: false }) )
        .send( function( error, result ){
          if ( error ){
            return next( error );
          }

          if ( !result.isValidAddress() ){
            return res.error( errors.input.INVALID_ADDRESS );
          }

          order.attributes.lat_lng = result.toAddress().lat_lng;

          return next();
        });
    }

  , order.save.bind( order )
  ], function( error ){
    if ( error ){
      return res.error( errors.internal.UNKNOWN, error );
    }

    var result = order.toJSON({ plain:true });

    Order.applyPriceHike( result );

    res.send( result );

    venter.emit( 'order:change', order.attributes.id );

    if ( datetimeChanged ){
      venter.emit( 'order:datetime:change', order, oldDatetime );
    }

    if ( oldType !== order.attributes.type ){
      venter.emit( 'order:type:change', order.attributes.type, oldType, order.attributes, req.user );
    }

    if ( oldPaymentStatus !== order.attributes.payment_status ){
      venter.emit('order:payment_status:change', order.attributes.payment_status, order.attributes.id);
    }

    db.order_revisions.track( order.attributes.id, req.user.attributes.id, 'update', function( error ){
      if ( error ){
        req.logger.warn('Error tracking order revision', {
          order: { id: order.attributes.id }
        , error: error
        });
      }
    });
  });
};

var fieldsRequiringFulfillabilityCheck = [
  'zip', 'guests', 'datetime'
];

module.exports.apiUpdate = function(req, res, next) {
  var logger = req.logger.create('Controller-Update');
  var order = req.order;
  var $update = {};

  // get keys from order def schema that allow editable access
  var updateableFields = Object.keys( orderDefinitionSchema ).filter( function( key ){
    return req.user.attributes.groups.some( function( group ){
      if ( !Array.isArray( orderDefinitionSchema[ key ].editable ) ){
        return true;
      }

      return utils.contains( orderDefinitionSchema[ key ].editable, group );
    });
  });

  var restaurantUpdateableFields = ['tip', 'tip_percent', 'reason_denied'];
  if (order.isRestaurantManager) updateableFields = restaurantUpdateableFields;

  if ( fieldsRequiringFulfillabilityCheck.some( key => key in req.body ) ){
    var restaurant = db.cache.restaurants.byId( order.restaurant_id );

    if ( restaurant ){
      // We need a POJO version of the order that has the restaurant
      // added to it so we can check things like fulfillability and
      // the Order Delivery Service Criteria Checker
      let orderWithRestaurant = utils.extend( {}, order, req.body, {
        restaurant: restaurant
      });

      // Determine whether or not the order should
      $update.type = orderWithRestaurant.type = odsChecker.check(
        orderWithRestaurant
      ) ? 'courier' : 'delivery';

      if ( $update.type !== order.type ){
        req.logger.warn('Changing order % type from % to %', order.id, order.type, $update.type);
      }

      let result = OrderFulfillability
        .create( orderWithRestaurant )
        .why();

      if ( Array.isArray( result ) && result.length ){
        let error = utils.clone( errors.input.FULFILLABILITY_FAILED );
        error.details = result;
        return next( error );
      }
    }
  }

  var datetimeChanged = req.body.datetime && order.datetime !== req.body.datetime;
  var oldDatetime = order.datetime;
  var oldType = order.type;
  var oldPaymentStatus = order.payment_status;

  var isTipEditable = models.Order.prototype.isTipEditable.call(
    { attributes: order },
    { isOwner: req.order.isOwner,
      isRestaurantManager: req.order.isRestaurantManager,
      isAdmin: req.order.isAdmin,
    }
  );

  if (!isTipEditable) updateableFields = utils.without(updateableFields, 'tip', 'tip_percent');

  utils.extend($update, utils.pick(req.body, updateableFields));

  utils.async.waterfall([
    // Geocode the address on the order if necessary
    function( next ){
      var bodyAddress = Address( req.body );

      // No address info, no need to geocode
      if ( bodyAddress.fulfilledComponents().length === 0 ){
        return next();
      }

      if ( !req.body.street ){
        return next();
      }

      var orderAddress = Address( order );

      if ( !orderAddress.hasMinimumComponents() ){
        return next();
      }

      GeocodeRequest()
        .address( orderAddress.toString({ street2: false }) )
        .send( function( error, result ){
          if ( error ){
            return next( error );
          }

          if ( !result.isValidAddress() ){
            return res.error( errors.input.INVALID_ADDRESS );
          }

          $update.lat_lng = result.toAddress().lat_lng;

          return next();
        });
    }

  , function( next ){
      var options = {
        returning: ['*']
      , one:  [ { table: 'restaurants', alias: 'restaurant'
                , one:  [ { table: 'regions', alias: 'region' } ]
                , many: [ ($update.type || order.type) === 'delivery'
                            ? { table: 'restaurant_lead_times', alias: 'lead_times' }
                            : { table: 'restaurant_pickup_lead_times', alias: 'pickup_lead_times' }
                        ]
                }
              ]
      };

      db.orders.update( order.id, $update, options, function( error, results ){
        if ( error ){
          req.logger.warn('Error updating order', {
            error: error
          });

          return next( error );
        }

        return next( null, results[0] );
      });
    }

  , function( orderResult, next ){
      res.json( orderResult );

      venter.emit( 'order:change', order.id );

      if ( datetimeChanged ){
        venter.emit( 'order:datetime:change', order, oldDatetime );
      }

      if ( oldType !== orderResult.type ){
        venter.emit( 'order:type:change', orderResult.type, oldType, orderResult, req.user );
      }

      if ( oldPaymentStatus !== orderResult.payment_status ){
        venter.emit('order:payment_status:change', orderResult.payment_status, orderResult.id);
      }

      db.order_revisions.track( order.id, req.user.attributes.id, 'update', function( error ){
        if ( error ){
          req.logger.warn('Error tracking order revision', {
            order: { id: order.id }
          , error: error
          });
        }
      });

      return next();
    }
  ], function( error ){
    if ( error ){
      return res.error( errors.internal.UNKNOWN, error );
    }
  });
};

module.exports.listStatus = function(req, res) {
  models.OrderStatus.find(
    {where: {order_id: req.params.oid},
     order: {created_at: 'desc'}},
    function(err, results) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      res.send(utils.invoke(results, 'toJSON'));
    }
  );
}

module.exports.changeStatus = function(req, res) {
  var logger = req.logger.create('Controller-OrderChangeStatus');

  logger.info('Attempt to change status', {
    order: { id: req.params.oid }
  });

  if (!req.body.status || !utils.has(models.Order.statusFSM, req.body.status))
    return res.send(400, req.body.status + ' is not a valid order status');

  var previousStatus = req.order.status;
  var orderModel = new models.Order( req.order );

  if ( req.order.status === req.body.status ){
    return res.send(204);
  }

  // if they're not an admin, check if the status change is ok.
  if(!req.user || (!req.order.isRestaurantManager && !req.order.isAdmin)) {
    if (!utils.contains(models.Order.statusFSM[req.order.status], req.body.status))
      return res.send(403, 'Cannot transition from status '+ req.order.status + ' to status ' + req.body.status);

    var review = utils.contains(['accepted', 'denied'], req.body.status);
    if (review && (req.body.review_token !== req.order.review_token || req.order.token_used != null))
      return res.send(401, 'bad review token');

    if (req.body.status === 'submitted' && !orderModel.isComplete())
      return res.send(403, 'order not complete');

    if (req.body.status === 'submitted' && !orderModel.toJSON().submittable)
      return res.send(403, 'order not submittable');
  }

  var done = function() {
    logger.info('Done called');
    if (req.order.status === 'submitted') {
      logger.info('Done called and status is submitted');

      // Save address based on this order's attributes if user has none
      var orderAddressFields = utils.pick(req.order, addressFields);

      logger.info('Finding default address for user');

      db.addresses.findOne({user_id: req.user.attributes.id, is_default: true}, function(error, address) {
        if (error) {
          logger.warn('Error looking up default user address', {
            error: error
          });
        }

        // User already has an address, no need to save first time
        if ( address ){
          return;
        }

        orderAddressFields.user_id = req.user.attributes.id;

        UserAddresses( orderAddressFields ).save( function( error ){
          if (error) {
            logger.warn('Error saving default user address', {
              error: error
            });
          }
        });
      });
    }

    logger.info('Order status changed. #%s from `%s` to `%s`', req.params.oid, previousStatus, req.body.status, {
      data: {
        review_token: req.body.review_token
      , from:         previousStatus
      , to:           req.body.status
      , notify:       req.query.notify
      }
    });

    res.send(201, {order_id: req.order.id, status: req.order.status});

    venter.emit('order:status:change'
      , new models.Order( req.order )
      , previousStatus
      , !(req.user
          && req.order.isAdmin
          && req.query.notify
          && req.query.notify.toLowerCase() === 'false')
      , req.user
      );

    if (req.order.promo_code)
    if (req.order.status === 'submitted') {

      db.promos.findOne({ "promo_code": req.order.promo_code }, function(err, result) {

        if(err) {
          req.logger.warn("Error looking up promo code.", {
            order_id: req.order.id
          , error: err
          });
          return;
        }

        if(result) {
          venter.emit('order:submitted:promo', req.order);
        }
      });
    }
  };

  var $update = {
    status: req.body.status
  };

  if (review) $update.token_used = 'now()';

  if (req.body.status === 'denied') {
    $update.reason_denied = req.body.reason_denied;
  }

  req.order.status = req.body.status;
  logger.info('Saving order');

  db.orders.update( req.order.id, $update, function(err){
    logger.info('Saving order complete!', err ? { error: err } : null);
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    db.order_revisions.track( req.order.id, req.user.attributes.id, 'change-status', function( error ){
      if ( error ){
        req.logger.warn('Error tracking order revision', {
          order: { id: req.order.id }
        , error: error
        });
      }
    });

    return done();
  });
};

module.exports.voice = function(req, res, next) {
  models.Order.findOne(parseInt(req.params.oid), function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!order) return res.send(404);
    res.render('order-voice', {layout:false, order: order.toJSON()}, function(err, xml) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      res.send(xml);
    });
  });
};

module.exports.duplicate = function(req, res, next) {
  var oldOrder = new models.Order({id: req.params.oid});
  oldOrder.createCopy(function(err, newOrder, lostItems) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (newOrder == null) return res.json(404);
    var obj = newOrder.toJSON();
    obj.lostItems = lostItems;
    res.json(201, obj);

    db.order_revisions.track( newOrder.attributes.id, req.user.attributes.id, 'duplication', function( error ){
      if ( error ){
        req.logger.warn('Error tracking order revision', {
          order: { id: order.attributes.id }
        , error: error
        });
      }
    });
  });
};

module.exports.receipt = function( req, res ){
  models.Order.findOne( +req.params.oid, function( error, order ){
    if ( error )  return res.error( errors.internal.DB_FAILURE, error );
    if ( !order ) return res.status(404).render('404');

    var options = {
      layout: 'invoice/invoice-layout'
    , order:  order.toJSON()
    };

    res.render( 'invoice/receipt', options );
  });
};

module.exports.rebuildPdf = function( req, res ){
  if ( !(req.params.type in pdfs) ){
    return res.error({
      type: 'input'
    , httpCode: '403'
    , name: 'INVALID_PDF'
    , message: 'The report of that type does not exist'
    });
  }

  pdfs[ req.params.type ].build({ orderId: req.params.oid });

  res.send(204);
};

module.exports.getDeliveryFee = function( req, res ){
  var location = req.order.location;

  if ( req.query.location_id ){
    var locations = req.order.restaurant.locations.filter( function( loc ){
      return loc.id == req.query.location_id;
    });

    if ( locations.length ){
      location = locations[0];
    } else {
      return res.error({
        type: 'INVALID_LOCATION'
      , message: 'Invalid parameter `location_id`'
      , httpCode: '403'
      });
    }
  }

  var origin = Address( req.order ).toString();
  var destination = Address( location ).toString();

  DMReq()
    .origin( origin )
    .destination( destination )
    .send()
    .then( function( results ){
      var result = results[0].elements[0];

      if ( result.status in errors.google.distanceMatrix ){
        throw errors.google.distanceMatrix[ result.status ];
      }

      res.json({
        distance:     result.distance
      , duration:     result.duration
      , pricePerMile: req.order.location.price_per_mile
      , basePrice:    req.order.location.base_delivery_fee
      , price:        deliveryFee({
                        pricePerMile: req.order.location.price_per_mile
                      , basePrice:    req.order.location.base_delivery_fee
                      , meters:       result.distance.value
                      }).getPrice()
      });
    })
    .catch( function( error ){
      req.logger.warn('Error getting distance between order and restaurant', {
        order_id: req.order.id
      , origin: origin
      , destination: destination
      , error: error
      });

      res.error( error );
    });
};
