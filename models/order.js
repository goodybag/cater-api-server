var Model = require('./model');
var utils = require('../utils');
var uuid  = require('node-uuid');
var db = require('../db');
var Restaurant = require('./restaurant');

'delivery_zips',
'delivery_times',
'lead_times',
'max_guests'


var modifyAttributes = function(callback, err, orders) {
  if (!err) {
    var restaurantFields = [
      'name',
      'delivery_fee',
      'minimum_order',
      'email',
      'sms_phone',
      'voice_phone',
      'is_bad_zip',
      'is_bad_guests',
      'is_bad_lead_time',
      'is_bad_delivery_time',
      'delivery_zips',
      'lead_times',
      'max_guests'
    ];
    utils.each(orders, function(order) {
      order.attributes.restaurant = utils.extend({ id: order.attributes.restaurant_id, delivery_times: utils.object(order.attributes.delivery_times) } , utils.pick(order.attributes, restaurantFields));
      utils.each(restaurantFields, function(field) { delete order.attributes[field]; });
      var fulfillables = utils.pick(order.attributes.restaurant, ['is_bad_zip', 'is_bad_guests', 'is_bad_lead_time', 'is_bad_delivery_time']);
      order.attributes.is_unacceptable = utils.reduce(fulfillables, function(a, b) {
        return a || b;
      }, false);
    });
  }
  callback.call(this, err, orders);
}

module.exports = Model.extend({
  getOrderItems: function(callback) {
    var self = this;
    callback = callback || function() {};
    require('./order-item').find(
      {where: {'order_id': self.attributes.id}},
      function(err, results) {
        if (err) return callback(err);
        self.orderItems = results;
        callback(null, results);
      });
  },
  getRestaurant: function(callback){
    var self = this;

    Restaurant.findOne({ where: { id: this.attributes.restaurant_id } }, function(error, restaurant){
      if (error) return callback(error);

      self.attributes.restaurant = restaurant.toJSON();

      callback(null, restaurant);
    });
  },
  save: function(callback) {
    var insert = this.attributes.id == null;
    if (insert) this.attributes.review_token = uuid.v4();
    var order = this
    Model.prototype.save.call(this, ["*", '("orders"."datetime"::text) as datetime'], function(err) {
      if (!err && insert) {
        var OrderStatus = require('./order-status');
        var status = new OrderStatus({order_id: order.attributes.id});
        status.save(callback);
      } else
        callback.apply(this, arguments);
    });
  },
  toJSON: function(options) {
    var obj = Model.prototype.toJSON.apply(this, arguments);
    if (!options || !options.review)
      obj = utils.omit(obj, ['review_token', 'token_used']);

    var ids = ['id', 'restaurant_id', 'user_id'];
    utils.each(ids, function(key) {
      obj[key] = '' + obj[key]
    });

    if (options && options.plain)
      return obj;

    if (this.orderItems) obj.orderItems = utils.invoke(this.orderItems, 'toJSON');
    obj.editable = this.attributes.status === 'pending';
    obj.cancelable = utils.contains(['pending', 'submitted'], this.attributes.status);

    if ( obj.restaurant && obj.restaurant.minimum_order ){
      obj.below_min = obj.sub_total < obj.restaurant.minimum_order;
    }

    obj.submittable = this.attributes.status === 'pending'
      && this.attributes.sub_total > 0
      && !obj.below_min
      && !this.attributes.is_unacceptable
    ;

    return obj;
  },
  requiredFields: [
    'datetime',
    'street',
    'city',
    'state',
    'zip',
    'phone',
    'guests'
  ],
  isComplete: function() {
    var vals = utils.pick(this.attributes, this.requiredFields);
    for (var key in vals) {
      if (vals[key] == null)
        return false
    }
    return true;
  }
}, {
  table: 'orders',

  find: function(query, callback) {
    // TODO: alter query to add latest status

    // query.order needs orders.id in order for distinct to work properly, this
    // messes with the user passing in a query object with different options.

    // TODO: It doesn't make sense to embed all this in the find function.
    // We should put this logic in another function or move it up to the code
    // that wants to execute such a query. The problem is that find is starting
    // to make too many assumptions about data you want back, and is limiting
    // your ability to actually control that.

    query = query || {};
    query.distinct = ["orders.id"];
    query.columns = query.columns || ['*'];
    query.order = query.order || ["orders.id"];

    // making datetime a string on purpose so that the server timezone isn't
    // applied to it when it is pulled out (there is no ofset set on this
    // because it cannot be determined due to DST until the datetime in
    // datetime)
    query.columns.push('(orders.datetime::text) as datetime');
    query.columns.push('latest.status');

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

    query.joins = query.joins || {};

    query.joins.latest = {
      type: 'left'
    , columns: ['order_id', 'status']
    , on: {
        'order_id': '$orders.id$'
      }
    , target: {
        type: 'select'
      , columns: ['order_id', 'status']
      , table: 'order_statuses'
      , alias: 'statuses'
      , joins: {
          recent: {
            type: 'inner'
          , on: {
              'order_id': '$statuses.order_id$'
            , 'created_at': '$statuses.created_at$'
            }
          , target: {
              type: 'select'
            , table: 'order_statuses'
            , columns: ['order_id', 'max(created_at) as created_at']
            , groupBy: 'order_id'
            }
          }
        }
      }
    };

    query.columns.push('totals.sub_total');

    query.joins.totals = {
      type: 'left'
    , columns: ['order_id', 'sub_total']
    , on: {'order_id': '$orders.id$'}
    , target: {
        type: 'select'
      , columns: ['order_id', 'sum(price * quantity) as sub_total']
      , table: 'order_items'
      , groupBy: 'order_id'
      }
    };

    query.columns.push('restaurants.name');
    query.columns.push('restaurants.delivery_fee')
    query.columns.push('restaurants.minimum_order');
    query.columns.push('restaurants.email');
    query.columns.push('restaurants.sms_phone');
    query.columns.push('restaurants.voice_phone');

    query.joins.restaurants = {
      type: 'inner'
    , on: {'id': '$orders.restaurant_id$'}
    }

    query.columns.push("(SELECT array(SELECT zip FROM restaurant_delivery_zips WHERE restaurant_id = orders.restaurant_id)) AS delivery_zips");
    query.columns.push('hours.delivery_times');
    query.columns.push("(SELECT array_to_json(array_agg(row_to_json(r))) FROM (SELECT lead_time, max_guests FROM restaurant_lead_times WHERE restaurant_id = orders.restaurant_id ORDER BY lead_time ASC) r ) AS lead_times");
    query.columns.push("(SELECT max(max_guests) FROM restaurant_lead_times WHERE restaurant_id = orders.restaurant_id) AS max_guests");

    query.joins.hours = {
      type: 'left'
    , target: 'dt'
    , on: { 'orders.restaurant_id': '$hours.restaurant_id$' }
    }

    query.columns.push('(submitted.created_at) as submitted');

    query.joins.order_statuses = {
      type: 'left'
    , alias: 'submitted'
    , on: {'order_id': '$orders.id$', 'status': 'submitted'}
    }

    var unacceptable = [];
    // check zip
    query.joins.zips = {
      type: 'left'
    , alias: 'zips'
    , target: 'restaurant_delivery_zips'
    , on: {
        'orders.restaurant_id': '$zips.restaurant_id$'
      , 'orders.zip': '$zips.zip$'
      }
    }

    var caseIsBadZip = '(CASE '
      + ' WHEN (orders.zip IS NULL) THEN NULL'
      + ' WHEN (zips.zip IS NULL) THEN TRUE'
      + ' ELSE FALSE'
      + ' END)'
    ;

    query.columns.push(caseIsBadZip+' AS is_bad_zip');

    // check # guests
    query.joins.guests = {
      type: 'left'
    , alias: 'guests'
    , target: 'restaurant_lead_times'
    , on: {
      'orders.restaurant_id': '$guests.restaurant_id$'
    , 'guests.max_guests' : {$gte: '$orders.guests$'}
      }
    }

    var caseIsBadGuests = '(CASE '
      + ' WHEN (orders.guests IS NULL) THEN NULL'
      + ' WHEN (guests.restaurant_id IS NULL) THEN TRUE'
      + ' ELSE FALSE'
      + ' END)'
    ;

    query.columns.push(caseIsBadGuests+' AS is_bad_guests');

    // check lead time
    query.joins.lead_times = {
      type: 'left'
    , alias: 'lead_times'
    , target: 'restaurant_lead_times'
    , on: {
        'orders.restaurant_id': '$lead_times.restaurant_id$'
      , 'lead_times.max_guests': {$gte: '$orders.guests$'}
      , 'lead_times.lead_time': {$custom: ['"lead_times"."lead_time" < EXTRACT(EPOCH FROM ("orders"."datetime" - now())/3600)']}
      }
    }

    var caseIsBadLeadTime = '(CASE '
      + ' WHEN (orders.datetime IS NULL) THEN NULL'
      + ' WHEN (lead_times.restaurant_id IS NULL) THEN TRUE'
      + ' ELSE FALSE'
      + ' END)'
    ;

    query.columns.push(caseIsBadLeadTime+' AS is_bad_lead_time');

    // check delivery days and times
    query.joins.delivery_times = {
      type: 'left'
    , alias: 'delivery_times'
    , target: 'restaurant_delivery_times'
    , on: {
        'orders.restaurant_id': '$delivery_times.restaurant_id$'
      , 'delivery_times.day': {$custom: ['"delivery_times"."day" = EXTRACT(DOW FROM "orders"."datetime")']}
      , 'delivery_times.start_time': {$custom: ['"delivery_times"."start_time" <= "orders"."datetime"::time']}
      , 'delivery_times.end_time': {$custom: ['"delivery_times"."end_time" >= "orders"."datetime"::time']}
      }
    }

    var caseIsBadDeliveryTime = '(CASE '
      + ' WHEN (orders.datetime IS NULL) THEN NULL'
      + ' WHEN (delivery_times.restaurant_id IS NULL) THEN TRUE'
      + ' ELSE FALSE'
      + ' END)'
    ;

    query.columns.push(caseIsBadDeliveryTime+' AS is_bad_delivery_time');

    // query.columns.push('(is_bad_zip OR is_bad_guests OR is_bad_lead_time OR is_bad_delivery_time AS is_unacceptable)');

    Model.find.call(this, query, utils.partial(modifyAttributes, callback));
  },

  // this is a FSM definition
  statusFSM: {
    canceled: [],
    pending: ['canceled', 'submitted'],
    submitted: ['canceled', 'denied', 'accepted'],
    denied: [],
    accepted: ['delivered'],
    delivered: []
  }
});
