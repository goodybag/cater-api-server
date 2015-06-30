var
  db = require('../../db')
, utils = utils = require('../../utils')
, errors = require('../../errors')
, queries = require('../../db/queries')
, restaurantSchema = require('../../db/definitions/restaurants').schema;
;

var restaurantDefinitionSchema = require('../../db/definitions/restaurants').schema;

module.exports.create = function (req, res) {
  var logger = req.logger.create('Controller-RestaurantsSignup-Create');

  db.restaurant_signups.insert(req.body, req.queryOptions, function (error, results) {
    if (error) {
      return res.error(errors.internal.DB_FAILURE, error);
    }

    results = results.length > 0 ? results[0] : results;

    //set user session with a restaurant signup id
    req.session.restaurant_signup_id = results.id;

    return res.json(results);
  });
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

var contacts = function(body, id) {
  return utils.map(body.contacts, function (contact) {
    contact.restaurant_id = id;
    return contact;
  });
}

var insert = function(values, method, done) {
  if (!values || values.length === 0) return done();
  var query = queries.restaurant[method](values);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function (error, results) {
    done(error, results);
  });
};

var createRestaurantFeatures = function (body, restaurant, callback) {

    var tasks = utils.map([
      [zips,            'createZips']
    , [deliveryTimes,   'createDeliveryTimes']
    , [leadTimes,       'createLeadTimes']
    , [hours,           'createHours']
    , [pickupLeadTimes, 'createPickupLeadTimes']
    , [tags,            'createTags']
    , [mealTypes,       'createMealTypes']
    , [mealStyles,      'createMealStyles']
    , [contacts,        'createContacts']
    ], function(args) {
      return utils.partial( insert, args[0](body, restaurant[0].id), args[1]);
    });

    utils.async.parallel(tasks, callback);
};

var createRestaurant = function (body, callback) {
  var fields = Object.keys( restaurantSchema );
  var values = utils.pick(body, fields);

  utils.async.waterfall([
    utils.partial(insert, values, 'create')
  , utils.partial(createRestaurantFeatures, body)
  ], callback);
}

module.exports.update = function (req, res) {
  var logger = req.logger.create('Controller-RestaurantsSignup-Update');

  db.restaurant_signups.update(req.queryObj, req.body, req.queryOptions, function (error, results) {
    if (error) {
      return res.error(errors.internal.DB_FAILURE, error);
    }

    results = results.length > 0 ? results[0] : results;

    if (results.status !== 'completed') return res.status(200).json(results);

    createRestaurant(results.data, function (error, results) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      return res.status(200).json(results);
    });

  });
};
