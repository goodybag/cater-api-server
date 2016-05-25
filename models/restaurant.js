var moment = require('moment-timezone');
var mosql = require('mongo-sql');
var pgRangeParser = require('pg-range-parser');

var Model = require('./model');
var config = require('../config');
var utils = require('../utils');

var Restaurant = module.exports = Model.extend({
  getCategories: function(query, callback) {
    var self = this;

    if (utils.isFunction(query)) {
      callback = query;
      query = {};
    }

    query = utils.deepExtend({
      where: { 'restaurant_id': this.attributes.id, 'is_hidden': false }
    , order: { order: 'asc' }
    }, query);

    callback = callback || function() {};
    require('./category').find(query, function(err, results) {
      if (err) return callback(err);
      self.categories = results;
      callback(null, results);
    });
  },

  getItems: function(query, options, callback) {
    var self = this;

    if ( typeof options === 'function' ) {
      callback = options;
      options = {};
    }

    if ( typeof query === 'function' ) {
      callback = query;
      query = {};
      options = {};
    }

    callback = callback || function() {};
    var items = function(err) {
      if (err) return callback(err);
      if (!self.categories || self.categories.length === 0)
        return callback(null, null);
      var categories = utils.map(self.categories, function(cat) { return cat.toJSON().id; });
      query = utils.deepExtend({
        where: { 'category_id': { $in: categories }, 'is_hidden': false },
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

    if (options.withHiddenCategories) {
      query = {
        where: { is_hidden: { $or: [true, false] } }
      };
    }

    self.categories ? items() : self.getCategories(query, items);
  },

  toJSON: function() {
    var obj = Model.prototype.toJSON.apply(this, arguments);
    if (this.categories) obj.categories = utils.invoke(this.categories, 'toJSON');
    obj.delivery_times = utils.defaults({}, obj.delivery_times, utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; })));
    obj.hours_of_operation = utils.defaults({}, obj.hours_of_operation, utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; })));
    obj.cuisine = obj.cuisine || [];
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

  getDeliveryZipsQuery: function( options ){
    options = options || {};

    var rQuery, dsQuery, query = {
      type: 'union'
    , queries: [
        rQuery = {
          type: 'select'
        , table: 'restaurant_delivery_zips'
        , columns: [
            { table: 'r', name: 'zip', alias: 'from' }
          , { table: 'restaurant_delivery_zips', name: 'zip', alias: 'to' }
          , { table: 'restaurant_delivery_zips', name: 'fee', alias: 'price' }
          , { table: 'r', name: 'id', alias: 'restaurant_id' }
          , { table: 'r', name: 'region_id', alias: 'region_id' }
          ]
        , where: utils.extend( {}, options.where )
        , joins: [
            { target: 'restaurants'
            , alias:  'r'
            , type:   'left'
            , on:     { id: '$restaurant_delivery_zips.restaurant_id$' }
            }
          ]
        }
      ]
    };

    if ( options.name ) query.name = options.name;
    if ( options.alias ) query.alias = options.alias;

    if ( options.zip ){
      rQuery.where['restaurant_delivery_zips.zip'] = options.zip;
    }

    if ( options.date || options.time ){
      rQuery.joins.push({
        target: 'regions', type: 'left', on: { id: '$r.region_id$' }
      });

      rQuery.joins.push({
        target: 'restaurant_delivery_times', type: 'left', on: { restaurant_id: '$r.id$' }
      });
    }

    if ( options.date ){
      rQuery.where['restaurant_delivery_times.day'] = {
        $custom: [
          'restaurant_delivery_times.day = extract( dow from $1::timestamp at time zone regions.timezone )'
        , options.date
        ]
      };
    }

    if ( options.time ){
      rQuery.where['restaurant_delivery_times.start_time'] = {
        $custom: [
          'restaurant_delivery_times.start_time <= $1::time at time zone regions.timezone'
        , options.time
        ]
      };

      rQuery.where['restaurant_delivery_times.end_time'] = {
        $custom: [
          'restaurant_delivery_times.end_time > $1::time at time zone regions.timezone'
        , options.time
        ]
      };
    }

    if ( options.date && options.time && options.guests ){
      rQuery.joins.push({
        target: 'restaurant_lead_times', type: 'left', on: { restaurant_id: '$r.id$' }
      });

      rQuery.where['restaurant_lead_times.lead_time'] = {
        $custom: [
          'restaurant_lead_times.lead_time * interval \'1 minute\' <= $1::timestamp at time zone regions.timezone - now()'
        , [ options.date, options.time ].join(' ')
        ]
      };

      rQuery.where['restaurant_lead_times.max_guests'] = {
        $custom: [
          'restaurant_lead_times.max_guests >= $1'
        , options.guests
        ]
      };
    }

    if ( options.with_delivery_services ){
      query.queries.push( dsQuery = {
        type: 'select'
      , table: 'delivery_service_zips'
      , columns: [
          { table: 'delivery_service_zips', name: 'from', alias: 'from' }
        , { table: 'delivery_service_zips', name: 'to', alias: 'to' }
        , { table: 'delivery_service_zips', name: 'price', alias: 'price' }
        , { table: 'r', name: 'id', alias: 'restaurant_id' }
        , { table: 'r', name: 'region_id', alias: 'region_id' }
        ]
      , where: utils.extend( { 'r.disable_courier': false }, options.where )
      , joins: [
          { target: 'restaurants'
          , alias:  'r'
          , type:   'left'
          , on:     { zip: '$delivery_service_zips.from$' }
          }
        ]
      });

      if ( options.zip ){
        dsQuery.where['delivery_service_zips.to'] = options.zip;
      }

      if ( options.date || options.time ){
        dsQuery.joins.push({
          target: 'regions', type: 'left', on: { id: '$r.region_id$' }
        });

        dsQuery.joins.push({
          target: 'restaurant_hours', type: 'left', on: { restaurant_id: '$r.id$' }
        });
      }

      if ( options.date ){
        dsQuery.where['restaurant_hours.day'] = {
          $custom: [
            'restaurant_hours.day = extract( dow from $1::timestamp at time zone regions.timezone )'
          , options.date
          ]
        };
      }

      if ( options.time ){
        dsQuery.where['restaurant_hours.start_time'] = {
          $custom: [
            'restaurant_hours.start_time <= $1::time at time zone regions.timezone'
          , options.time
          ]
        };

        dsQuery.where['restaurant_hours.end_time'] = {
          $custom: [
            'restaurant_hours.end_time > $1::time at time zone regions.timezone'
          , options.time
          ]
        };
      }

      if ( options.date && options.time && options.guests ){
        dsQuery.joins.push({
          target: 'restaurant_pickup_lead_times', type: 'left', on: { restaurant_id: '$r.id$' }
        });

        dsQuery.where['restaurant_pickup_lead_times.lead_time'] = {
          $custom: [
            'restaurant_pickup_lead_times.lead_time * interval \'1 minute\' <= $1::timestamp at time zone regions.timezone - now()'
          , [ options.date, options.time ].join(' ')
          ]
        };

        dsQuery.where['restaurant_pickup_lead_times.max_guests'] = {
          $custom: [
            'restaurant_pickup_lead_times.max_guests >= $1'
          , options.guests
          ]
        };
      }
    }

    return query;
  },

  getDeliveryTimesQuery: function( options ){
    options = options || {};

    var columns = Object.keys( require('../db/definitions/restaurant-delivery-times').schema );

    var query = {
      type: 'union'
    , queries: [
        { type: 'select', table: 'restaurant_delivery_times', columns: columns }
      , { type: 'select', table: 'restaurant_hours', columns: columns }
      ]
    };

    if ( options.name ) query.name = options.name;

    // Alter the start/end times to reflect the regions lead_time modifier
    if ( options.time ){
      var rHours = query.queries[1];

      rHours.columns = rHours.columns.slice(0);

      rHours.columns[ rHours.columns.indexOf('start_time') ] = {
        type: 'expression'
      , expression: 'start_time + regions.lead_time_modifier'
      };

      rHours.columns[ rHours.columns.indexOf('end_time') ] = {
        type: 'expression'
      , expression: 'end_time + regions.lead_time_modifier'
      };

      rHours.joins = [
        { type: 'left', target: 'restaurants', on: { id: '$' + rHours.table + '.restaurant_id$' } }
      , { type: 'left', target: 'regions', on: { id: '$restaurants.region_id$' } }
      ];
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
    query.order = query.order || ["is_unacceptable ASC", "restaurants.is_featured DESC", "restaurants.popularity DESC", "restaurants.id ASC"];
    query.joins = query.joins || {};
    query.distinct = (query.distinct != null) ? query.distinct : ["restaurants.name", "is_unacceptable", "restaurants.id", "restaurants.popularity", "restaurants.is_featured"];
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
                , expression: 'array[restaurant_delivery_times.start_time, restaurant_delivery_times.end_time]'
                }
              }
            }
          ]
        , groupBy: ['restaurant_id', 'day']
        }
      , groupBy: 'restaurant_id'
      }
    , all_delivery_zips: Restaurant.getDeliveryZipsQuery({
        with_delivery_services: query.with_delivery_services
      })
    };

    query.columns.push({
      alias: 'region'
    , expression: {
        type: 'one'
      , table: 'regions'
      , where: { id: '$restaurants.region_id$' }
      , parenthesis: true
      }
    });
    query.columns.push("(SELECT array(SELECT zip FROM restaurant_delivery_zips WHERE restaurant_id = restaurants.id ORDER BY zip ASC)) AS delivery_zips");
    query.columns.push("(SELECT array(SELECT \"to\" FROM delivery_service_zips WHERE \"from\" = restaurants.zip ORDER BY \"to\" ASC)) AS delivery_service_zips");
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
    query.columns.push("(SELECT max(r.max_guests) FROM ( select max_guests, restaurant_id from restaurant_lead_times union select max_guests, restaurant_id from restaurant_pickup_lead_times) r WHERE r.restaurant_id = restaurants.id) AS max_guests");

    query.columns.push({
      alias: 'delivery_fee'
    , expression: {
        type: 'select'
      , parenthesis: true
      , columns: ['price']
      , limit: 1
      , order: 'price asc'
      , table: Restaurant.getDeliveryZipsQuery(
          utils.extend(
            { alias: 'all_delivery_zips'
            , with_delivery_services: true
            , where: { 'r.id': '$restaurants.id$'}
            }
          , orderParams
          )
        )
      }
    });

    query.columns = query.columns.concat( Restaurant.getRegionColumns() );
    query.joins.regions = Restaurant.getRegionJoin();

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

    if (orderParams && orderParams.id) {
      // If associated to an order, attach amenities
      query.columns.push({
        type: 'array_to_json'
      , alias: 'amenities'
      , expression: {
          type: 'array'
        , expression: {
            type: 'select'
          , columns: [ { expression: 'row_to_json(r)', alias: 'amenities' } ]
          , table: {
              type: 'select'
            , columns: [ '*', {
                type: 'exists'
              , alias: 'checked'
              , expression: {
                  type: 'select'
                , columns: [ { expression: 1 } ]
                , table: 'order_amenities'
                , where: { order_id: orderParams.id, amenity_id: '$amenities.id$' }
                }
              }]
            , table: 'amenities'
            , where: { restaurant_id: '$restaurants.id$' }
            , alias: 'r'
            }
          }
        }
      });
    }

    /**
     * Search restaurants
     */
    if (orderParams && orderParams.search) {
      query.where.search_vector = { $partialMatches: orderParams.search };
    }

    /**
     * Sort by price, order min, or delivery fee
     */
    if (orderParams && orderParams.sort) {
      var sortedCol = config.sortQueryTable[orderParams.sort];
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

      query.where['meal_types.meal_types'] = {'$contains': orderParams.mealTypes};
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

    if (orderParams && !isNaN(parseInt(orderParams.guests))) {
      query.joins.guests = {
        type: 'left'
      , alias: 'guests'
      , on: {'restaurants.id': '$guests.restaurant_id$'}
      , distinct: true
      , target: {
          type: 'union'
        , queries: [
            {
              type: 'select'
            , table: 'restaurant_lead_times'
            , distinct: true
            , columns: ['restaurant_id']
            , where: {
                'max_guests': {$gte: orderParams.guests}
              }
            }
          , {
              type: 'select'
            , table: 'restaurant_pickup_lead_times'
            , distinct: true
            , columns: ['restaurant_id']
            , where: {
                'max_guests': {$gte: orderParams.guests}
              }
            }
          ]
        }
      }

      query.columns.push('(guests.restaurant_id IS NULL) AS is_bad_guests');
      unacceptable.push('(guests.restaurant_id IS NULL)');
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
      query.with.all_delivery_times = Restaurant.getDeliveryTimesQuery( orderParams );

      query.joins.delivery_times = {
        type: 'left'
      , alias: 'delivery_times'
      , target: 'all_delivery_times'
      , on: {
          'restaurant_id': '$restaurants.id$'
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

      var formattedDateTime = datetime.format('YYYY-MM-DD HH:mm:00');

      query.joins.lead_times = {
        type: 'left'
      , alias: 'lead_times'
      , on: {'restaurants.id': '$lead_times.restaurant_id$'}
      , distinct: true
      , target: {
          type: 'union'
        , queries: [
            {
              type: 'select'
            , table: 'restaurant_lead_times'
            , distinct: true
            , columns: ['restaurant_id']
            , where: {
                'max_guests': {$gte: ((orderParams.guests) ? orderParams.guests : 0)}
              , 'lead_time': {$custom: ['"restaurant_lead_times"."lead_time" <= EXTRACT(EPOCH FROM ($1 - (now() AT TIME ZONE regions.timezone) )/60)', formattedDateTime]}
              }
            , joins: [
                { type: 'left', target: 'restaurants', on: { id: '$restaurant_lead_times.restaurant_id$' } }
              , { type: 'left', target: 'regions', on: { id: '$restaurants.region_id$' } }
              ]
            }
          , {
              type: 'select'
            , table: 'restaurant_pickup_lead_times'
            , distinct: true
            , columns: ['restaurant_id']
            , where: {
                'max_guests': {$gte: ((orderParams.guests) ? orderParams.guests : 0)}
              , 'lead_time': {$custom: ['"restaurant_pickup_lead_times"."lead_time" <= EXTRACT(EPOCH FROM (((($1 AT TIME ZONE regions.timezone) - regions.lead_time_modifier) AT TIME ZONE regions.timezone) - (now() AT TIME ZONE regions.timezone) )/60)', formattedDateTime]}
              }
            , joins: [
                { type: 'left', target: 'restaurants', on: { id: '$restaurant_pickup_lead_times.restaurant_id$' } }
              , { type: 'left', target: 'regions', on: { id: '$restaurants.region_id$' } }
              ]
            }
          ]
        }
      }

      query.columns.push('(lead_times.restaurant_id IS NULL) AS is_bad_lead_time');
      unacceptable.push('(lead_times.restaurant_id IS NULL)');

      query.joins.delivery_times.on['delivery_times.day'] = {
        $custom: [ 'delivery_times.day = extract( dow from $1 at time zone regions.timezone )', datetime ]
      };
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

    if ( query.limit !== 1 && orderParams && orderParams.withContractFirst ){
      query.order.unshift('restaurants.plan_id is not null desc');
      query.distinct.unshift('restaurants.plan_id is not null');
      query.distinct = query.distinct.join(', ');
    }

    Model.find.call(this, query, function(err, restaurants) {
      if (!err) {
        utils.invoke(restaurants, function() {
          this.attributes.delivery_times = utils.object(this.attributes.delivery_times);
          this.attributes.hours_of_operation = utils.object(this.attributes.hours_of_operation);
        });

        if ( utils.findWhere(query.includes, { type: 'closed_restaurant_events' } ) ) {
          utils.invoke(restaurants, function() {
            this.attributes.event_date_ranges = this.attributes.event_date_ranges.map( function( range ){
              return pgRangeParser.parse( range );
            });
          });
        }
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
