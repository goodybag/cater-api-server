var moment = require('moment-timezone');

var Model = require('./model');
var utils = require('../utils');

module.exports = Model.extend({
  getCategories: function(callback) {
    var self = this;
    callback = callback || function() {};
    require('./category').find(
      {where: {'restaurant_id': this.attributes.id},
       order: {order: 'asc'}},
      function(err, results) {
        if (err) return callback(err);
        self.categories = results;
        callback(null, results);
      });
  },

  getItems: function(callback) {
    var self = this;
    callback = callback || function() {};
    var items = function(err) {
      if (err) return callback(err);
      if (!self.categories || self.categories.length === 0)
        return callback(null, null);
      var categories = utils.map(self.categories, function(cat) { return cat.toJSON().id; });
      require('./item').find({
        where: {'category_id': {$in: categories}},
        order: {order: 'asc'},
        limit: null,
        columns: ['*', '(SELECT array(SELECT tag FROM item_tags WHERE item_id = items.id ORDER BY tag ASC)) AS tags']},
        function(err, results) {
          if (err) return callback(err);
          self.items = results;

          var catIndex = utils.object(utils.map(self.categories, function(cat) {
            return cat.attributes.id;
          }), self.categories);

          utils.each(results, function(item) {
            var cat = catIndex[item.attributes.category_id];
            cat.items ? cat.items.push(item) : cat.items = [item];
          });

          callback(null, results);
        }
      );
    }

    self.categories ? items() : self.getCategories(items);
  },

  toJSON: function() {
    var obj = Model.prototype.toJSON.apply(this, arguments);
    if (this.categories) obj.categories = utils.invoke(this.categories, 'toJSON');
    obj.delivery_times = utils.defaults({}, obj.delivery_times, utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; })));
    return obj;
  }
},

{
  table: 'restaurants',

  findOne: function(query, orderParams, callback) {
    if (utils.isFunction(orderParams)) {
      callback = orderParams;
      orderParams = null;
    }

    if (!utils.isObject(query)) query = {where: {id: query}};
    query.limit = 1;
    query.distinct = false;
    return this.find(query, orderParams, function(err, models) {
      if (err) return callback(err);
      callback(null, models[0]);
    });
  },

  find: function(query, orderParams, callback) {
    if (utils.isFunction(orderParams)) {
      callback = orderParams;
      orderParams = null;
    }

    // query.order needs is_unacceptable and restaurants.id in order for
    // distinct to work properly. This messes with the user passing in a query
    // object with different options.

    // TODO: It doesn't make sense to embed all this in the find function.
    // We should put this logic in another function or move it up to the code
    // that wants to execute such a query. The problem is that find is starting
    // to make too many assumptions about data you want back, and is limiting
    // your ability to actually control that.

    query = query || {};
    query.columns = query.columns || ['*'];
    query.order = query.order || ["is_unacceptable ASC", "restaurants.name ASC", "restaurants.id ASC"];
    query.joins = query.joins || {};
    query.distinct = (query.distinct != null) ? query.distinct : ["restaurants.name", "is_unacceptable", "restaurants.id"];
    query.where = query.where || {};

    if (orderParams && 'is_hidden' in orderParams){
      query.where.is_hidden = orderParams.is_hidden;
    }

    query.with = {
      dt: {
        type: 'select'
      , columns: [
          'restaurant_id'
        , {
            type: 'array_to_json'
          , as: 'delivery_times'
          , expression: {
              type: 'array_agg'
            , expression: {
                type: 'array_to_json'
              , expression: 'array[(day::text)::json, times]'
              }
            }
          }
        ]
      , table: {
          type: 'select'
        , table: 'restaurant_delivery_times'
        , columns: [
            'restaurant_id'
          , 'day'
          , {
              type: 'array_to_json'
            , as: 'times'
            , expression: {
                type: 'array_agg'
              , expression: {
                  type: 'array_to_json'
                , expression: 'array[start_time, end_time]'
                }
              }
            }
          ]
        , groupBy: ['restaurant_id', 'day']
        , alias: 'day_hours'
        }
      , groupBy: 'restaurant_id'
      }
    };

    query.columns.push("(SELECT array(SELECT zip FROM restaurant_delivery_zips WHERE restaurant_id = restaurants.id ORDER BY zip ASC)) AS delivery_zips");
    query.columns.push("(SELECT array(SELECT tag FROM restaurant_tags WHERE restaurant_id = restaurants.id ORDER BY tag ASC)) AS tags");
    query.columns.push("(SELECT array(SELECT meal_type FROM restaurant_meal_types WHERE restaurant_id = restaurants.id ORDER BY meal_type ASC)) AS meal_types");
    query.columns.push("(SELECT array(SELECT meal_style FROM restaurant_meal_styles WHERE restaurant_id = restaurants.id ORDER BY meal_style ASC)) AS meal_styles");
    query.columns.push('hours.delivery_times');
    query.columns.push("(SELECT array_to_json(array_agg(row_to_json(r))) FROM (SELECT lead_time, max_guests, cancel_time FROM restaurant_lead_times WHERE restaurant_id = restaurants.id ORDER BY lead_time ASC) r ) AS lead_times");
    query.columns.push("(SELECT max(max_guests) FROM restaurant_lead_times WHERE restaurant_id = restaurants.id) AS max_guests");
    query.joins.hours = {
      type: 'left'
    , target: 'dt'
    , on: { 'restaurants.id': '$hours.restaurant_id$' }
    }

    var unacceptable = [];

    /**
     * Sort by price, order min, or delivery fee
     */
    if (orderParams && orderParams.sort) {
      var sortedCol = null;

      switch (orderParams.sort) {
        case 'name':
          sortedCol = 'name ASC';
          break;
        case 'price':
          sortedCol = 'price ASC';
          break;
        case 'priced':
          sortedCol = 'price DESC';
          break;
        case 'ordermin':
          sortedCol = 'minimum_order ASC';
          break;
        case 'ordermind':
          sortedCol = 'minimum_order DESC';
          break;
        case 'deliveryfee':
          sortedCol = 'delivery_fee ASC';
          break;
        case 'deliveryfeed':
          sortedCol = 'delivery_fee DESC';
          break;
      }

      if (sortedCol) {

        // insert after head of array (prioritize after is_unacceptable)
        query.order.splice(1, 0, sortedCol);

        // lob off the direction qualifier
        query.distinct.splice(1, 0, sortedCol.split(' ')[0]);
      }
    }

    if (orderParams && orderParams.diets) {
      query.with.tags_arr = {
        "type": "select"
      , "table": "restaurant_tags"
      , "columns": [
          "restaurant_id"
        , "array_agg(tag) as tags"
        ]
      , "groupBy": "restaurant_id"
      };

      query.joins.tags_arr = {
        type: 'left'
      , alias: 'tags'
      , target: 'tags_arr'
      , on: {
          'restaurants.id': '$tags.restaurant_id$'
        }
      };

      query.where["tags.tags"] = {'$contains': orderParams.diets};
    }

    if (orderParams && orderParams.mealTypes) {
      query.with.meal_types_arr = {
        "type": "select"
      , "table": "restaurant_meal_types"
      , "columns": [
          "restaurant_id"
        , "array_agg(meal_type) as meal_types"
        ]
      , "groupBy": "restaurant_id"
      };

      query.joins.meal_types_arr = {
        type: 'left'
      , alias: 'meal_types'
      , target: 'meal_types_arr'
      , on: {
          'restaurants.id': '$meal_types.restaurant_id$'
        }
      };

      query.where['meal_types.meal_types'] = {'$overlap': orderParams.mealTypes};
    }

    if (orderParams && orderParams.mealStyles) {
      query.with.meal_styles_arr = {
        "type": "select"
      , "table": "restaurant_meal_styles"
      , "columns": [
          "restaurant_id"
        , "array_agg(meal_style) as meal_styles"
        ]
      , "groupBy": "restaurant_id"
      };

      query.joins.meal_styles_arr = {
        type: 'left'
      , alias: 'meal_styles'
      , target: 'meal_styles_arr'
      , on: {
          'restaurants.id': '$meal_styles.restaurant_id$'
        }
      };

      query.where['meal_styles.meal_styles'] = {'$overlap': orderParams.mealStyles};
    }

    if (orderParams && orderParams.prices) {
      query.where.price = {'$in': orderParams.prices};
    }

    if (orderParams && orderParams.cuisines) {
      query.where.cuisine = {'$overlap': orderParams.cuisines};
    }

    if (orderParams && orderParams.zip) {
      query.joins.zips = {
        type: 'left'
      , alias: 'zips'
      , target: 'restaurant_delivery_zips'
      , on: {
          'restaurants.id': '$zips.restaurant_id$'
        , 'zips.zip': orderParams.zip
        }
      }

      query.columns.push('(zips.zip IS NULL) AS is_bad_zip');
      unacceptable.push('(zips.zip IS NULL)');
    }

    if (orderParams && orderParams.guests) {
      query.joins.guests = {
        type: 'left'
      , alias: 'guests'
      , on: {'restaurants.id': '$guests.restaurant_id$'}
      , target: {
          type: 'select'
        , table: 'restaurant_lead_times'
        , distinct: true
        , columns: ['restaurant_id']
        , where: {
            'max_guests': {$gte: orderParams.guests}
          }
        }
      }

      query.columns.push('(guests.restaurant_id IS NULL) AS is_bad_guests');
      unacceptable.push('(guests.restaurant_id IS NULL)');
    }

    if (orderParams && (orderParams.date || orderParams.time)) {
      query.joins.delivery_times = {
        type: 'left'
      , alias: 'delivery_times'
      , target: 'restaurant_delivery_times'
      , on: {
          'restaurants.id': '$delivery_times.restaurant_id$'
        }
      }

      query.columns.push('(delivery_times.id IS NULL) AS is_bad_delivery_time');
      unacceptable.push('(delivery_times.id IS NULL)');
    }

    // TODO: only allow valid dates in order params, currently assumes so
    if (orderParams && orderParams.date) {
      // determine if lead time is unacceptable only if date is provided

      // TODO: only allow valid times in order params, currently assumes so

      // supports either standard or military time
      var datetime = moment(orderParams.date + ' ' + (orderParams.time || '11:59 pm'), 'YYYY-MM-DD hh:mm a');

      var formattedDateTime = datetime.format('YYYY-MM-DD HH:MM:59');

      query.joins.lead_times = {
        type: 'left'
      , alias: 'lead_times'
      , on: {'restaurants.id': '$lead_times.restaurant_id$'}
      , target: {
          type: 'select'
        , table: 'restaurant_lead_times'
        , distinct: true
        , columns: ['restaurant_id']
        , where: {
            'max_guests': {$gte: ((orderParams.guests) ? orderParams.guests : 0)}
            // TODO: Assume timezone of the restaurant (restaurant needs timezone column), for now hardcoding America/Chicago
          , 'lead_time': {$custom: ['"restaurant_lead_times"."lead_time" <= EXTRACT(EPOCH FROM ($1 -  (now() AT TIME ZONE \'America/Chicago\') )/3600)', formattedDateTime]}
          }
        }
      }

      query.columns.push('(lead_times.restaurant_id IS NULL) AS is_bad_lead_time');
      unacceptable.push('(lead_times.restaurant_id IS NULL)');

      var day = moment(datetime).tz('America/Chicago').day();

      query.joins.delivery_times.on['delivery_times.day'] = day;
    }

    if (orderParams && orderParams.time) {
      query.joins.delivery_times.on['delivery_times.start_time'] = {$lte: orderParams.time};
      query.joins.delivery_times.on['delivery_times.end_time'] = {$gte: orderParams.time};
    }

    query.columns.push((unacceptable.length) ? '('+unacceptable.join(' OR')+') as is_unacceptable' : '(false) as is_unacceptable');

    Model.find.call(this, query, function(err, restaurants) {
      if (!err) {
        utils.invoke(restaurants, function() {
          this.attributes.delivery_times = utils.object(this.attributes.delivery_times);
        });
      }
      return callback.call(this, err, restaurants);
    });
  },
});
