var moment = require('moment-timezone');

var Model = require('./model');
var utils = require('../utils');

var Restaurant = module.exports = Model.extend({
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

  getItems: function(query, callback) {
    var self = this;

    if ( typeof query === 'function' ) {
      callback = query;
      query = {};
    }

    callback = callback || function() {};
    var items = function(err) {
      if (err) return callback(err);
      if (!self.categories || self.categories.length === 0)
        return callback(null, null);
      var categories = utils.map(self.categories, function(cat) { return cat.toJSON().id; });
      query = utils.deepExtend({
        where: { 'category_id': { $in: categories } },
        order: {order: 'asc'},
        limit: null,
        columns: ['*', '(SELECT array(SELECT tag FROM item_tags WHERE item_id = items.id ORDER BY tag ASC)) AS tags']
      }, query);

      require('./item').find(query, function(err, results) {
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
      });
    }

    self.categories ? items() : self.getCategories(items);
  },

  toJSON: function() {
    var obj = Model.prototype.toJSON.apply(this, arguments);
    if (this.categories) obj.categories = utils.invoke(this.categories, 'toJSON');
    obj.delivery_times = utils.defaults({}, obj.delivery_times, utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; })));
    obj.hours_of_operation = utils.defaults({}, obj.hours_of_operation, utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; })));
    return obj;
  }
},

{
  table: 'restaurants',

  getHoursQuery: function( options ){
    var query = {
      type: 'select'
    , columns: [
        'restaurant_id'
      , {
          type: 'array_to_json'
        , as: 'hours_times'
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
      , alias: 'day_hours'
      , table: 'restaurant_hours'
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
              , expression: 'array[restaurant_hours.start_time, restaurant_hours.end_time]'
              }
            }
          }
        ]
      , groupBy: ['restaurant_id', 'day']
      }
    , groupBy: 'restaurant_id'
    };

    return query;
  },

  // Coerces restaurant_delivery_zips into a `from`->`to` data model
  // Unions with the delivery_service_zips
  //
  // select "restaurants"."zip" as "from",
  //       "restaurant_delivery_zips"."zip" as "from",
  //       "restaurant_delivery_zips"."fee" as "price",
  //       "restaurants"."id" as "restaurant_id",
  //       "restaurants"."region_id" as "region_id"
  // from "restaurant_delivery_zips"
  // join "restaurants" "restaurants" on "restaurants"."id" = "restaurant_delivery_zips"."restaurant_id"
  // union select "delivery_service_zips"."from" as "from",
  //              "delivery_service_zips"."to" as "to",
  //              "delivery_service_zips"."price" as "price",
  //              "restaurants"."id" as "restaurant_id",
  //              "restaurants"."region_id" as "region_id"
  // from "delivery_service_zips"
  // join "restaurants" "restaurants" on "restaurants"."zip" = "delivery_service_zips"."from")
  getDeliveryZipsQuery: function( options ){
    options = options || {};

    var query = {
      type: 'union'
    , queries: [
        {
          type: 'select'
        , table: 'restaurant_delivery_zips'
        , columns: [
            { table: 'restaurants', name: 'zip', alias: 'from' }
          , { table: 'restaurant_delivery_zips', name: 'zip', alias: 'to' }
          , { table: 'restaurant_delivery_zips', name: 'fee', alias: 'price' }
          , { table: 'restaurants', name: 'id', alias: 'restaurant_id' }
          , { table: 'restaurants', name: 'region_id', alias: 'region_id' }
          ]
        , joins: {
            restaurants: {
              on: { id: '$restaurant_delivery_zips.restaurant_id$' }
            }
          }
        }
      ]
    };

    if ( options.with_delivery_services ){
      query.queries.push({
        type: 'select'
      , table: 'delivery_service_zips'
      , columns: [
          { table: 'delivery_service_zips', name: 'from', alias: 'from' }
        , { table: 'delivery_service_zips', name: 'to', alias: 'to' }
        , { table: 'delivery_service_zips', name: 'price', alias: 'price' }
        , { table: 'restaurants', name: 'id', alias: 'restaurant_id' }
        , { table: 'restaurants', name: 'region_id', alias: 'region_id' }
        ]
      , joins: {
          restaurants: {
            on: { zip: '$delivery_service_zips.from$' }
          }
        }
      });
    }

    return query;
  },

  getRegionJoin: function(){
    return {
      type: 'left'
    , target: 'regions'
    , on: { id: '$restaurants.region_id$' }
    };
  },

  getRegionColumns: function( options ){
    options = utils.defaults( options || {}, {
      table: 'regions'
    , aliases: {}
    , columns: ['sales_tax', 'timezone']
    });

    var columns = [];

    options.columns.forEach( function( col ){
      var obj = {
        table:  options.table
      , name:   col
      };

      if ( options.aliases[ col ] ){
        obj.alias = options.aliases[ col ];
      }

      columns.push( obj );
    });

    return columns;
  },

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
    query.includes = query.includes || [];

    if ( !('with_delivery_services' in query) ){
      query.with_delivery_services = true;
    }

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
        , alias: 'day_hours'
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
                // , expression: 'array[restaurant_delivery_times.start_time, restaurant_delivery_times.end_time]'
                , expression: [
                    'array['
                  , 'least('
                    , 'restaurant_delivery_times.start_time, '
                    , 'restaurant_hours.start_time + regions.lead_time_modifier'
                  , '), greatest('
                    , 'restaurant_delivery_times.end_time, '
                    , 'restaurant_hours.end_time + regions.lead_time_modifier'
                  , ')]'
                  ].join('')
                }
              }
            }
          ]
          // Join on hours to include delivery service hours
        , joins: [
            { alias: 'restaurants'
            , type: 'left'
            , target: 'restaurants'
            , on: { id: '$restaurant_delivery_times.restaurant_id$' }
            }
          // , utils.extend( { alias: 'regions' }, Restaurant.getRegionJoin() )
          // , { alias: 'restaurant_hours'
          //   , type: 'left'
          //   , target: 'restaurant_hours'
          //   , on: {
          //       restaurant_id: '$restaurant_delivery_times.restaurant_id$'
          //     , day: '$restaurant_delivery_times.day$'
          //     }
          //   }
          ]
        , groupBy: ['restaurant_id', 'day']
        }
      , groupBy: 'restaurant_id'
      }
    , all_delivery_zips: Restaurant.getDeliveryZipsQuery( query )
    };

    query.columns.push("(SELECT array(SELECT zip FROM restaurant_delivery_zips WHERE restaurant_id = restaurants.id ORDER BY zip ASC)) AS delivery_zips");
    query.columns.push([
      '(select array_to_json( array('
    , '  select row_to_json( r ) as delivery_zips from ('
    , '    select distinct on (price) price as fee, array_agg("to") over ( partition by price ) as zips'
    , '    from all_delivery_zips'
    , '    where all_delivery_zips.restaurant_id = restaurants.id'
    , '  ) r'
    , ')) as delivery_zip_groups)'
    ].join('\n'));
    query.columns.push("(SELECT array(SELECT tag FROM restaurant_tags WHERE restaurant_id = restaurants.id ORDER BY tag ASC)) AS tags");
    query.columns.push("(SELECT array(SELECT meal_type FROM restaurant_meal_types WHERE restaurant_id = restaurants.id ORDER BY meal_type ASC)) AS meal_types");
    query.columns.push("(SELECT array(SELECT meal_style FROM restaurant_meal_styles WHERE restaurant_id = restaurants.id ORDER BY meal_style ASC)) AS meal_styles");
    query.columns.push('hours.delivery_times');
    query.columns.push("(SELECT array_to_json(array_agg(row_to_json(r))) FROM (SELECT lead_time, max_guests, cancel_time FROM restaurant_lead_times WHERE restaurant_id = restaurants.id ORDER BY lead_time ASC) r ) AS lead_times");
    query.columns.push("(SELECT coalesce(array_to_json(array_agg(row_to_json(r))), \'[]\'::json) FROM (SELECT lead_time, max_guests, cancel_time FROM restaurant_pickup_lead_times WHERE restaurant_id = restaurants.id ORDER BY lead_time ASC) r ) AS pickup_lead_times");
    query.columns.push("(SELECT max(max_guests) FROM restaurant_lead_times WHERE restaurant_id = restaurants.id) AS max_guests");
    var feeCol = query.columns.push({
      type: 'select'
    , alias: 'delivery_fee'
    , table: 'all_delivery_zips'
    , columns: ['price']
    , where: { restaurant_id:  '$restaurants.id$' }
    , limit: 1
    , order: 'price asc'
    }) - 1;

    query.columns = query.columns.concat( Restaurant.getRegionColumns() );
    query.joins.regions = Restaurant.getRegionJoin();

    if ( orderParams && orderParams.zip ){
      query.columns[ feeCol ].where.to = orderParams.zip;
    }

    query.joins.hours = {
      type: 'left'
    , target: 'dt'
    , on: { 'restaurants.id': '$hours.restaurant_id$' }
    };

    // Hours of operation
    query.with.hours_of_operation = Restaurant.getHoursQuery( query );

    query.joins.hoo = {
      type: 'left'
    , target: 'hours_of_operation'
    , on: { 'restaurant_id': '$restaurants.id$' }
    };

    query.columns.push({
      alias: 'hours_of_operation'
    , type: 'coalesce'
    , expression: 'hoo.hours_times, \'[]\'::json'
    });

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
        case 'minorder':
          sortedCol = 'minimum_order ASC NULLS FIRST';
          break;
        case 'minorderd':
          sortedCol = 'minimum_order DESC NULLS LAST';
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
        if ( query.distinct ) query.distinct.splice(1, 0, sortedCol.split(' ')[0]);
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
      , target: 'all_delivery_zips'
      , on: {
          'restaurants.id': '$zips.restaurant_id$'
        , 'to': orderParams.zip
        }
      }

      // query.joins.zips = {
      //   type: 'left'
      // , target: {
      //     type: 'union'
      //   , queries: [
      //       { type: 'select'
      //       , table: 'restaurant_delivery_zips'
      //       , columns: ['zip']
      //       , where: { 'restaurant_id': '$restaurants.id$' }
      //       }
      //     , {

      //       }
      //     ]
      //   }
      // };

      query.columns.push('(zips.to IS NULL) AS is_bad_zip');
      unacceptable.push('(zips.to IS NULL)');
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

    // join user favorites
    var favorites = utils.findWhere(query.includes, { type: 'favorites' } );
    if ( favorites ) {
      includeFavorites(query, favorites);
    }

    // filter favorites
    if (favorites && orderParams && orderParams.favorites === 'true' ) {
      query.where['ufr.user_id'] = favorites.userId;
    }

    // Hide restaurants from listing if there's an event occurring
    if ( utils.findWhere(query.includes, { type: 'filter_restaurant_events' } ) ) {
      filterRestaurantsByEvents(query, orderParams);
    }

    // Include restaurant event duration in result
    if ( utils.findWhere(query.includes, { type: 'closed_restaurant_events' } ) ) {
      includeClosedRestaurantEvents(query, orderParams);
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
          , 'lead_time': {$custom: ['"restaurant_lead_times"."lead_time" <= EXTRACT(EPOCH FROM ($1 -  (now() AT TIME ZONE \'America/Chicago\') )/60)', formattedDateTime]}
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

    var contactsInfo = ['sms_phones', 'voice_phones', 'emails'];
    contactsInfo.forEach( function(type){
      query.columns.push(Restaurant.getContactsInfo(type));
    });

    Model.find.call(this, query, function(err, restaurants) {
      if (!err) {
        utils.invoke(restaurants, function() {
          this.attributes.delivery_times = utils.object(this.attributes.delivery_times);
        });
      }
      return callback.call(this, err, restaurants);
    });
  },


  /**
   * @param {String} type is one of (sms_phones|voice_phones|emails)
   */
  getContactsInfo: function(type) {
    var query = {
      type: 'array'
    , expression: {
        type: 'select'
      , columns: [
          {
            type: 'unnest'
          , expression: 'contacts.' + type
          }
        ]
      , table: 'contacts'
      , where: {
          'contacts.restaurant_id': '$restaurants.id$'
        , 'contacts.notify': true
        }
      }
    , as: type
    };
    return query;
  }
});

/**
 * Remove restaurants from the result set if
 * there is an active event going on
 *
 * @param {object} query - Query object to be modified
 * @param {object} searchParams - Object contains various order
 *   parameters such as datetime, guests and zip code.
 */
var filterRestaurantsByEvents = function(query, searchParams) {

  // Subselect restaurant_events occurring today or on search param date
  query.with.restaurant_events = {
    'type': 'select'
  , 'table': 'restaurant_events'
  , 'columns': [ '*' ]
  , 'where': {
      'during': {
        '$dateContains': searchParams && searchParams.date ? searchParams.date : 'now()'
      }
    , 'closed': true
    }
  };

  query.joins.restaurant_events = {
    type: 'left outer'
  , alias: 're'
  , target: 'restaurant_events'
  , on: {
      'restaurants.id': '$re.restaurant_id$'
    }
  };

  // Filter out events
  query.where['re.id'] = { '$null': true };
}

/**
 * Get restaurant events that are closed for
 * this restaurant. Used for order date validation.
 * Query result is called `event_date_ranges`.
 *
 * @param {object} query - Query object to be modified
 * @param {object} searchParams - Object contains various order
 *   parameters such as datetime, guests and zip code.
 */
var includeClosedRestaurantEvents = function(query, searchParams) {
  query.with.restaurant_events = {
    'type': 'select'
  , 'table': 'restaurant_events'
  , 'columns': [ '*' ]
  , 'where': {
      'closed': true
    }
  };

  query.columns.push('(select array_to_json(array(select during from restaurant_events where restaurant_events.restaurant_id=restaurants.id) ) ) as event_date_ranges');
}

/**
 * Join user's favorite restaurants
 *
 * @param {object} query
 * @param {object} opts
 */
var includeFavorites = function(query, opts) {
  query.with.user_fav_restaurants = {
    type: 'select'
  , table: 'favorite_restaurants'
  , columns: [ '*' ]
};

  query.joins.user_fav_restaurants = {
    type: 'left'
  , alias: 'ufr'
  , target: 'user_fav_restaurants'
  , on: {
      'restaurants.id': '$ufr.restaurant_id$'
    }
  };

  // dear god..i just wanted to see if the user fav'd a restaurant
  // exists(select 1 from user_fav_restaurants where user_id=$1 and restaurant_id=restaurants.id) as favorite
  query.columns.push({
    type: 'exists'
  , expression: {
      type: 'select'
    , columns: [ { expression: '1'} ]
    , table: 'user_fav_restaurants'
    , where: {
        user_id: opts.userId
      , restaurant_id: '$restaurants.id$'
      }
    }
  , as: 'favorite'
  });
};
