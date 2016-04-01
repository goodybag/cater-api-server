var
  moment = require('moment-timezone')
, db = require('../../db')
, queries = require('../../db/queries')
, errors = require('../../errors')
, utils = require('../../utils')
, states = require('../../public/js/lib/states')
, enums = require('../../db/enums')
, cuisines = require('../../public/cuisines')
, json2csv = require('json2csv')
, _ = require('lodash')
, helpers = require('../../public/js/lib/hb-helpers')
, orderFulfillability = require('stamps/orders/fulfillability')
, restaurantsFilter = require('../../public/js/lib/restaurants-filter')
;

cuisines = cuisines.sort();

var models = require('../../models');
var restaurantDefinitionSchema = require('../../db/definitions/restaurants').schema;
var OrderItem = require('stamps/orders/item');
var Order = require('stamps/orders/base');

utils.findWhere(states, {abbr: 'TX'}).default = true;

module.exports.list = function(req, res) {
  var logger = req.logger.create('Controller-Restaurants-List');

  var results = db.cache.restaurants.byRegion( req.user.attributes.region_id );

  if ( results.error ){
    logger.error('Error getting restaurants by region', {
      error: error
    });

    return res.error( results.error );
  }

  if (!_.isEqual(req.session.searchParams, req.query)) {
    req.session.searchParams = _.cloneDeep(req.query);
  }

  return res.render('restaurant/list', {
    layout:           'layout/default'
  , defaultAddress:   req.user.attributes.defaultAddress
  , restaurants:      restaurantsFilter( results, req.query, {
                        sorts_by_no_contract: req.user.attributes.region.sorts_by_no_contract
                      , timezone:             req.user.attributes.region.timezone
                      })
  , filterCuisines:   cuisines
  , filterPrices:     utils.range(1, 5)
  , filterMealTypes:  enums.getMealTypes()
  , filterMealStyles: enums.getMealStyles()
  , filterDiets:      enums.getTags()
  });
};

module.exports.get = function(req, res) {
  var logger = req.logger.create('Controller-Restaurants-Get');
  logger.info('getting restaurant %s', req.params.rid);

  if (req.restaurant.is_hidden && !req.user.isAdmin()) {
    return res.status(404).render('404');
  }

  var queryOptions = req.query || {};

  var userId = req.creatorId || req.user.attributes.id;
  var tasks = [
    function(callback) {
      var order;

      if ( req.order ){
        order = new models.Order( req.order );
      } else {
        order = new models.Order({
          restaurant_id:  req.restaurant.id
        , user_id:        userId
        , adjustment:     { description: null, amount: null }
        });

        return order.getRestaurant( function( error ){
          callback( error, order );
        });
      }

      return order.getRestaurant( function( error ){
        callback( error, order );
      });
    },

    function(callback) {
      var query = {
        where: {
          id: req.restaurant.id
        }
      , columns: ['*']
      , includes: [ {type: 'closed_restaurant_events'} ]
      };

      query.columns.push({
        alias: 'delivery_service'
      , expression: {
          type: 'one'
        , table: 'delivery_services'
        , parenthesis: true
          // Just pick one delivery service that applies
          // We'll come up with better logic later
        , where: { region_id: '$restaurants.region_id$' }
        }
      });

      query.columns.push({
        alias: 'photos'
      , expression: {
          parenthesis: true
        , expression: {
            type: 'array_to_json'
          , expression: {
              type: 'array'
            , expression: {
                type: 'select'
              , alias: 'p'
              , table: 'restaurant_photos'
              , columns: [{ type: 'row_to_json', expression: 'p' }]
              , order: 'priority asc'
              , where: { restaurant_id: '$restaurants.id$' }
              }
            }
          }
        }
      });

      models.Restaurant.findOne(query, queryOptions, function(err, restaurant) {
        if (err) return callback(err);
        if (!restaurant) return res.status(404).render('404');
        restaurant.getItems({ where: { 'is_hidden': false } }, function(err, items) {
          if (err) return callback(err);

          // Apply user price hike
          (items || []).forEach( function( item ){
            Order.applyPriceHikeToItem( item.attributes, req.user.attributes.priority_account_price_hike_percentage );
          });

          callback(err, restaurant);
        });
      });
    },

    function(callback) {
      if ( !userId ) return callback();
      models.Address.findOne({where: { user_id: userId, is_default: true }}, callback);
    }
  ];

  var done = function(err, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    var orderParams = req.query || {};

    var context = {
      order:            results[0] ? results[0].toJSON() : null,
      restaurant:       results[1] ? results[1].toJSON() : null,
      defaultAddress:   results[2] ? results[2].toJSON() : null,
      orderParams:      orderParams,
      searchParams:     req.session.searchParams
    }

    // Use the same data model we use for fulfillability during search
    // so we can inform menu whether or not supplied order params
    // are fulfillable. The original data passed in is too different
    // than what the fulfillability model is expecting, so just pull
    // the cached version so the models have the option to use it
    context.restaurant._cached = db.cache.restaurants.byId( context.restaurant.id );

    context.restaurant.delivery_fee = context.order.restaurant.delivery_fee;

    // Copy fields that don't exist from the restaurant result to order.restaurant
    for ( var key in context.restaurant ){
      if ( !(key in context.order.restaurant) ){
        context.order.restaurant[ key ] = context.restaurant[ key ];
      }
    }

    // Build a histogram of menus vs freq for labeling
    var menuLengths = utils.countBy(utils.flatten(utils.pluck(context.restaurant.categories, 'menus')));

    // Sum all types as `full` menu
    utils.each(menuLengths, function(val, key, list) {
      menuLengths.full = (menuLengths.full || 0) + val;
    });

    context.restaurant.menuLengths = menuLengths;

    var fulfillability = orderFulfillability( context.order );
    fulfillability.restaurant = context.restaurant._cached;
    context.disableCheckout = !fulfillability.isFulfillable();

    res.render('menu', context, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      return res.send(html);
    });
  };

  utils.async.parallel(tasks, done);
};

module.exports.sort = function(req, res) {
  models.Restaurant.findOne(parseInt(req.params.rid), function(err, restaurant) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!restaurant) return res.render('404');
    restaurant.getItems(function(err, items) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      var selectedPrice = utils.object(utils.map([1, 2, 3, 4], function(i) {
        return [new Array(i+1).join('$'), restaurant.attributes.price === i];
      }));
      utils.findWhere(states, {abbr: restaurant.attributes.state || 'TX'}).default = true;
      res.render('sort-menu', {
        restaurant: restaurant.toJSON()
      , selectedPrice: selectedPrice
      , states: states
      , mealTypesList: enums.getMealTypes()
      , mealStylesList: enums.getMealStyles()
      }, function(err, html) {
        if (err) return console.log(err, err.stack), res.error(errors.internal.UNKNOWN, err);
        res.send(html);
      });
    });
  });
};

module.exports.listManageable = function(req, res) {
  models.Restaurant.find(
    {
      where: {
        id: {$in: req.user.attributes.restaurant_ids}
      }
    }
  , function(error, restaurants) {
      var context = {restaurants: utils.invoke(restaurants, 'toJSON'), states: states, isNew: true};
      context.restaurant = {delivery_times: utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; }))};  // tmp hack
      res.render('user-manage-restaurants', context, function(error, html) {
        if (error) return res.error(errors.internal.UNKNOWN, error);
        return res.send(html);
      });
    }
  );
};

var zips = function(body, id) {
  return utils.map(body.delivery_zips, function(zip, index, arr) {
    return {restaurant_id: id,  zip: zip.zip, fee: zip.fee }
  });
}

var deliveryTimes = function(body, id) {
  return Array.prototype.concat.apply([], utils.map(body.delivery_times, function(times, day, obj) {
    return utils.map(times, function(period, index, arr) {
      return {
        restaurant_id: id,
        day: day,
        start_time: period[0],
        end_time: period[1]
      };
    });
  }));
}

var leadTimes = function(body, id) {
  return utils.map(body.lead_times, function(obj, index, arr) {
    return utils.extend({restaurant_id: id}, obj);
  });
}

var hours = function(body, id) {
  return Array.prototype.concat.apply([], utils.map(body.hours_of_operation, function(times, day, obj) {
    return utils.map(times, function(period, index, arr) {
      return {
        restaurant_id: id,
        day: day,
        start_time: period[0],
        end_time: period[1]
      };
    });
  }));
}

var pickupLeadTimes = function(body, id) {
  return utils.map(body.pickup_lead_times, function(obj, index, arr) {
    return utils.extend({restaurant_id: id}, obj);
  });
}

var tags = function(body, id) {
  return utils.map(body.tags, function(obj, index, arr) {
    return {restaurant_id: id, tag: obj};
  });
};

var mealTypes = function(body, id) {
  return utils.map(body.meal_types, function(obj, index, arr) {
    return {restaurant_id: id, meal_type: obj};
  });
};

var mealStyles = function(body, id) {
  return utils.map(body.meal_styles, function(obj, index, arr) {
    return {restaurant_id: id, meal_style: obj};
  });
};

// get keys from restaurant definition shema
var getFields = function (req) {
  return Object.keys( restaurantDefinitionSchema ).filter( function ( key ) {
    return req.user.attributes.groups.some( function ( group ) {
      return utils.contains( restaurantDefinitionSchema[ key ].editable, group);
    });
  });
};

module.exports.create = function(req, res) {
  var logger = req.logger.create('Controller-RestaurantsCreate');

  var fields = getFields( req );

  // Normalize single quotes to apostrophe
  var name = req.body.name.replace(/[‘’]/g, '\'');

  utils.stripe.accounts.create({
    managed: true
  , country: 'US'
  , business_name: name
  }, function(error, acct) {
    if (error) {
      logger.error('Unable to create restaurant in stripe', error);
      return res.error(errors.internal.UNKNOWN, error);
    }

    var values = utils.pick(req.body, fields);
    values.stripe_id = acct.id;

    var restaurantQuery = queries.restaurant.create(values);

    var sql = db.builder.sql(restaurantQuery);
    db.query(sql.query, sql.values, function(err, rows, result) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);

      var insert = function(values, method, callback) {
        if (!values || values.length === 0) return callback();
        var query = queries.restaurant[method](values);
        var sql = db.builder.sql(query);
        db.query(sql.query, sql.values, callback);
      }

      var tasks = utils.map([
        [zips,            'createZips']
      , [deliveryTimes,   'createDeliveryTimes']
      , [leadTimes,       'createLeadTimes']
      , [hours,           'createHours']
      , [pickupLeadTimes, 'createPickupLeadTimes']
      , [tags,            'createTags']
      , [mealTypes,       'createMealTypes']
      , [mealStyles,      'createMealStyles']
      ], function(args) {
        return utils.partial( insert, args[0](req.body, rows[0].id), args[1]);
      });

      var done = function(err, results) {
        if (err) {
          logger.info('Unable to create restaurant');
          return res.error(errors.internal.UNKNOWN, err);
        }
        logger.info('Created new restaurant', { restaurant: rows[0] });
        res.redirect('/admin/restaurants/' + rows[0].id);
      };

      utils.async.parallel(tasks, done);
    });
  });
}

module.exports.update = function(req, res) {
  var fields = getFields( req );

  db.transaction( function( error, tx ){
    if ( error ) return res.error( errors.internal.DB_FAILURE, error );

    // this should be an array of three functions, each an async eachSeries to destroy and recreate
    // the subrecords associated with this restaurant.
    // it's a series, so the delete query should always complete before the assocated insert query on the same table.
    // but each table is independent.
    var tasks = utils.map([
      ['Zips', zips, 'delivery_zips']
    , ['DeliveryTimes', deliveryTimes, 'delivery_times']
    , ['LeadTimes', leadTimes, 'lead_times']
    , ['Hours', hours, 'hours_of_operation']
    , ['PickupLeadTimes', pickupLeadTimes, 'pickup_lead_times']
    , ['Tags', tags, 'tags']
    , ['MealTypes', mealTypes, 'meal_types']
    , ['MealStyles', mealStyles, 'meal_styles']
    ],
    function(args) {
      if (req.body[args[2]] === undefined) return utils.async.noop;
      var delQuery = queries.restaurant['del' + args[0]](req.params.rid)
      var values = args[1](req.body, req.params.rid);
      var createQuery = values.length > 0 ? queries.restaurant['create' + args[0]](values) : null;

      return utils.partial(utils.async.eachSeries, [delQuery, createQuery], function(query, cb) {
        if (!query) return cb();
        var sql = db.builder.sql(query);
        tx.query(sql.query, sql.values, cb);
      });
    });

    // add the acutal restaurant table update as the fourth parallel function.
    tasks.push(function(cb) {
      var updates = utils.pick(req.body, fields);
      if (utils.size(updates) === 0) return cb();
      var query = queries.restaurant.update(updates, req.params.rid);
      var sql = db.builder.sql(query);
      tx.query(sql.query, sql.values, cb);
    });


    utils.async.series([
      tx.begin.bind( tx )
    , utils.async.parallel.bind( utils.async, tasks )
    , tx.commit.bind( tx )
    ], function( error ){
      if ( error ){
        tx.abort();
        return res.error( errors.internal.DB_FAILURE, error );
      }

      res.status(204).send();
    });
  });
}

module.exports.remove = function(req, res) {
  new models.Restaurant({ id: req.params.rid }).destroy(function( error ){
    if (error) return res.error(errors.internal.DB_FAILURE, error);

    res.send(204);
  });
}

module.exports.listItems = function(req, res) {
  (new models.Restaurant({id: req.params.rid})).getItems(function(error, items) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(utils.invoke(items, 'toJSON'));
  });
}

module.exports.menuCsv = function( req, res ){
  var r = new models.Restaurant({ id: req.params.rid });

  r.getItems( function( error, items ){
    if ( error ) return res.error( errors.internal.DB_FAILURE, error );

    if ( !items || items.length === 0 ) return res.send(404);

    items = _.invoke( items, 'toJSON' );

    var tags = _(items).pluck('tags').flatten().unique().value();

    var columns = Object.keys( items[0] ).concat( 'options', tags ).filter( function( t ){
      // Omit fields
      return [
        'options_sets'
      , 'tags'
      , 'created_at'
      , 'category_id'
      , 'restaurant_id'
      ].indexOf( t ) === -1;
    });

    items = items.map( function( item ){
      // Format options as:
      //   Group1: o1, o2, ... - Group2: o1, o2....
      item.options = _(
        item.options_sets
      ).map( function( n ){
        return n.name + ': ' + _(
          n.options
        ).flatten()
        .pluck('name')
        .value()
        .join(', ');
      }).join(' - ');

      _.intersection( tags, item.tags ).forEach( function( t ){
        item[ t ] = true;
      });

      items.price = helpers.dollars( items.price );

      delete item.tags;
      delete item.options_sets;

      return item;
    });

    json2csv({ data: items, fields: columns }, function( error, csv ){
      if ( error )  return res.error( errors.internal.UNKNOWN, error );;

      res.header( 'Content-Type', 'text/csv' );
      res.header( 'Content-Disposition', 'attachment;filename=menu.csv' );

      res.send( csv );
    });
  });
};

module.exports.copy = function(req, res) {
  var logger = req.logger.create('Controller-Restaurants-Copy');
  var id = req.params.restaurant_id;

  var tasks = [
    db.restaurants.findOne.bind(db.restaurants, id)

  , function createStripeUri(restaurant, callback) {
      utils.stripe.accounts.create({
        managed: true
      , country: 'US'
      , business_name: restaurant.name
      }, function(err, acct) {
        callback(err, restaurant, acct);
      });
    }

  , function copyRestaurant(restaurant, acct, callback) {
      var data = utils.extend({ }, utils.omit(restaurant, 'id', 'text_id', 'uuid'), {
        balanced_customer_uri: null
      , stripe_id: acct.id
      , name: restaurant.name + ' Copy'
      , is_hidden: true
      });
      db.restaurants.insert( data, function(err, result) {
        callback(err, restaurant, err ? null : result[0].id);
      });
    }

  , function getContacts(oldRestaurant, newId, callback) {
      db.contacts.find({ restaurant_id: oldRestaurant.id }, function(err, contacts) {
        contacts = contacts.map(function(contact) {
          contact.restaurant_id = newId;
          contact.name = contact.name || '';
          delete contact.id;
          return contact;
        });
        callback(err, oldRestaurant, newId, contacts);
      });
    }

  , function copyContacts(oldRestaurant, newId, contacts, callback) {
      db.contacts.insert(contacts, function(err) {
        callback(err, oldRestaurant, newId);
      });
    }

  , function getDeliveryTimes(oldRestaurant, newId, callback) {
      db.restaurant_delivery_times.find({ restaurant_id: oldRestaurant.id }, function(err, times) {
        times = times.map(function(time) {
          time.restaurant_id = newId;
          delete time.id;
          return time
        });
        callback(err, oldRestaurant, newId, times);
      });
    }

  , function copyDeliveryTimes(oldRestaurant, newId, times, callback) {
      db.restaurant_delivery_times.insert(times, function(err) {
        callback(err, oldRestaurant, newId);
      });
    }

  , function getLeadTimes(oldRestaurant, newId, callback) {
      db.restaurant_lead_times.find({ restaurant_id: oldRestaurant.id }, function(err, times) {
        times = times.map(function(time) {
          time.restaurant_id = newId;
          delete time.id;
          return time
        });
        callback(err, oldRestaurant, newId, times);
      });
    }

  , function copyLeadTimes(oldRestaurant, newId, times, callback) {
      db.restaurant_lead_times.insert(times, function(err) {
        callback(err, oldRestaurant, newId);
      });
    }

  , function getHours(oldRestaurant, newId, callback) {
      db.restaurant_hours.find({ restaurant_id: oldRestaurant.id }, function(err, times) {
        times = times.map(function(time) {
          time.restaurant_id = newId;
          delete time.id;
          return time
        });
        callback(err, oldRestaurant, newId, times);
      });
    }

  , function copyHours(oldRestaurant, newId, times, callback) {
      db.restaurant_hours.insert(times, function(err) {
        callback(err, oldRestaurant, newId);
      });
    }

  , function getPickupLeadTimes(oldRestaurant, newId, callback) {
      db.restaurant_pickup_lead_times.find({ restaurant_id: oldRestaurant.id }, function(err, times) {
        times = times.map(function(time) {
          time.restaurant_id = newId;
          delete time.id;
          return time
        });
        callback(err, oldRestaurant, newId, times);
      });
    }

  , function copyPickupLeadTimes(oldRestaurant, newId, times, callback) {
      db.restaurant_pickup_lead_times.insert(times, function(err) {
        callback(err, oldRestaurant, newId);
      });
    }

  /**
   *  dirac can't insert without id
   *  unfortunately restaurant_tags are keyed by (restaurant_id, tag)
   *  so this doesn't work
   */

  // , function getTags(oldRestaurant, newId, callback) {
  //     db.restaurant_tags.find({ restaurant_id: oldRestaurant.id }, function(err, tags) {
  //       tags = tags.map(function(tag) {
  //         tag.restaurant_id = newId;
  //         console.log(tag);
  //         return tag;
  //       });
  //       callback(err, oldRestaurant, newId, tags);
  //     });
  //   }

  // , function copyTags(oldRestaurant, newId, tags, callback) {
  //     db.restaurant_tags.insert(tags, function(err) {
  //       callback(err, oldRestaurant, newId);
  //     });
  //   }

  , function getCategories(oldRestaurant, newId, callback) {
      db.categories.find({ restaurant_id: oldRestaurant.id }, function(err, categories){
        callback(err, oldRestaurant, newId, categories);
      });
    }

  , function copyCategories(oldRestaurant, newId, categories, callback) {
      var oldCatIds = utils.pluck(categories, 'id');
      var newCatIds;
      categories = categories.map(function(cat) {
        return utils.extend(utils.omit(cat, 'id'), { restaurant_id: newId });
      });
      db.categories.insert(categories, function(err, categories) {
        newCatIds = utils.pluck(categories, 'id');

        var catMap = utils.object(oldCatIds, newCatIds);
        callback(err, oldRestaurant, newId, catMap);
      });
    }

  , function getItems(oldRestaurant, newId, catMap, callback) {
      db.items.find({ restaurant_id: oldRestaurant.id }, function(err, items) {
        if ( err ) return callback( err );
        items.map(function(item) {
          // associate to newly duplicated rows
          item.category_id = catMap[item.category_id];
          item.restaurant_id = newId;
          item.options_sets = JSON.stringify(item.options_sets);
          delete item.id;
          return item;
        });

        callback(err, items, newId);
      });
    }

  , function copyItems(items, newId, callback) {
      db.items.insert(items, function(err, results) {
        callback(err, newId);
      });
    }
  ];

  utils.async.waterfall(tasks, function(err, newId) {
    if ( err ) {
      logger.error('Error copying restaurant', { error: error });
      return res.send(500, err);
    }
     res.redirect('/admin/restaurants/' + newId);
  });
};
