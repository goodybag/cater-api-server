var pg = require('pg');  // access db driver directly
var uuid  = require('node-uuid');
var config = require('../config');
var utils = require('../utils');
var logger = require('../logger');
var venter = require('../lib/venter');

var db = require('../db');
var queryTransform = require('../db/query-transform');
var Model = require('./model');
var queries = require('../db/queries');
var Restaurant = require('./restaurant');
var Transaction = require('./transaction');
var TransactionError = require('./transaction-error');
var moment = require('moment-timezone');

var modifyAttributes = function(callback, err, orders) {
  if (!err) {
    var restaurantFields = [
      'delivery_fee',
      'minimum_order',
      'emails',
      'sms_phones',
      'voice_phones',
      'is_bad_zip',
      'is_bad_guests',
      'is_bad_lead_time',
      'is_bad_delivery_time',
      'delivery_zips',
      'lead_times',
      'max_guests'
    ];
    utils.each(orders, function(order) {
      if (order.attributes.restaurant_id != null) {
        order.attributes.restaurant = utils.extend(
          {
            id: order.attributes.restaurant_id,
            delivery_times: utils.object(order.attributes.delivery_times),
            emails: order.attributes.emails,
            sms_phones: order.attributes.sms_phones,
            voice_phones: order.attributes.voice_phones,
            name: order.attributes.restaurant_name,
            balanced_customer_uri: order.attributes.restaurant_balanced_customer_uri
          },
          utils.pick(order.attributes, restaurantFields));
        order.attributes.restaurant.delivery_times = utils.defaults(order.attributes.restaurant.delivery_times, utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; })));
        utils.each(restaurantFields, function(field) { delete order.attributes[field]; });

        var rate = 1.0825; // default Austin, TX sales tax for now, in future store in and get from restaurant table
        var totalPreTip = (parseInt(order.attributes.sub_total) + parseInt(order.attributes.restaurant.delivery_fee)) * parseFloat(rate);
        order.attributes.total = Math.round(totalPreTip + order.attributes.tip); // in cents

        // Handle reward promos
        var submitted = moment(order.attributes.submitted);
        var promo = utils.find(config.rewardsPromos, function(promo) {
          var eligible = submitted >= moment(promo.start) &&
                         submitted <  moment(promo.end);
          return eligible;
        });

        if ( promo ) {
          order.attributes.points = Math.floor(order.attributes.total * promo.rate / 100);
        } else {
          order.attributes.points = Math.floor(order.attributes.total / 100);
        }

      } else {
        order.attribtues.restaurant = null;
      }

      var fulfillables = utils.pick(order.attributes.restaurant, ['is_bad_zip', 'is_bad_guests', 'is_bad_lead_time', 'is_bad_delivery_time']);
      order.attributes.is_unacceptable = utils.reduce(fulfillables, function(a, b) { return a || b; }, false);

      order.attributes.user = {
        id: order.attributes.user_id,
        email: order.attributes.user_email,
        organization: order.attributes.organization,
        name: order.attributes.user_name,
        balanced_customer_uri: order.attributes.user_balanced_customer_uri
      };

      delete order.attributes.user_email;
      delete order.attributes.organization;
      delete order.attributes.user_name;
      delete order.attributes.user_balanced_customer_uri;

      order.attributes.adjustment = {
        amount: order.attributes.adjustment_amount,
        description: order.attributes.adjustment_description
      };
      delete order.attributes.adjustment_amount;
      delete order.attributes.adjustment_description;
    });
  }
  callback.call(this, err, orders);
}

module.exports = Model.extend({
  getDeliveryFeeQuery: function(){
    var query = {
      type: 'select'
    , alias: 'delivery_fee'
    , table: 'restaurant_delivery_zips'
    , columns: ['fee']
    , where: {
        restaurant_id:  this.attributes.restaurant_id
      }
    , limit: 1
    };

    if ( this.attributes.zip ){
      query.where.zip = this.attributes.zip;
    } else {
      query.order = 'fee asc';
    }

    return query;
  },

  getOrderItems: function(callback, client) {
    var self = this;
    callback = callback || function() {};
    require('./order-item').find(
      {where: {'order_id': self.attributes.id}},
      function(err, results) {
        if (err) return callback(err);
        self.orderItems = results;
        callback(null, results);
      }, client);
  },
  getRestaurant: function(callback, client){
    var self = this;

    var query = {
      where: { id: this.attributes.restaurant_id }
    , columns: ['*']
    };

    query.columns.push( this.getDeliveryFeeQuery() );

    Restaurant.findOne(query, function(error, restaurant){
      if (error) return callback(error);

      self.attributes.restaurant = restaurant.toJSON();

      callback(null, restaurant);
    }, client);
  },
  save: function(query, callback, client) {
    if (utils.isFunction(query)) {
      callback = query;
      query = undefined;
    }

    var insert = this.attributes.id == null;
    if (insert) this.attributes.review_token = uuid.v4();
    if (this.attributes.adjustment) {
      this.attributes.adjustment_amount = this.attributes.adjustment.amount;
      this.attributes.adjustment_description = this.attributes.adjustment.description;
      delete this.attributes.adjustment;
    }
    var order = this;
    Model.prototype.save.call(this, {
      returning: [
        "*"
      , { expression: '("orders"."datetime"::text)', alias: 'datetime' }
      ]
  }, function(err) {

      callback.apply(this, arguments);
      venter.emit( 'order:change', order.attributes.id );
    }, client);
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

    var inTimeToCancel;
    if (obj.guests != null && obj.datetime != null && obj.restaurant) {
      var cancelTime = (utils.find(utils.sortBy(obj.restaurant.lead_times, 'max_guests'), function(lead) {
        return lead.max_guests >= obj.guests;
      }) || 0).cancel_time;

      if (cancelTime) {
        var now = moment().tz(obj.timezone).format('YYYY-MM-DD HH:mm:ss');
        var hours = (new Date(obj.datetime) - new Date(now)) / 3600000;

        inTimeToCancel = hours >= cancelTime;
      }
    }

    if (this.orderItems) obj.orderItems = utils.invoke(this.orderItems, 'toJSON');
    obj.editable = utils.contains(['pending', 'submitted'], this.attributes.status);
    obj.cancelable = (this.attributes.status === 'accepted' && inTimeToCancel) || utils.contains(['pending', 'submitted'], this.attributes.status);

    if ( obj.restaurant && obj.restaurant.minimum_order ){
      obj.below_min = obj.sub_total < obj.restaurant.minimum_order;
    }

    obj.submittable = this.attributes.status === 'pending'
      && this.attributes.sub_total > 0
      && !obj.below_min
      && !this.attributes.is_unacceptable
    ;

    var requiredAddrFields = ['street', 'city', 'state', 'zip', 'phone']
    obj.isAddressComplete = utils.reduce(utils.map(utils.pick(obj, requiredAddrFields),
                                                   function(val) { return val != null && val !== ''; }),
                                         function(memo, item, list) { return memo && item; }, true);

    if (options && options.manifest){
      obj.manifest = this.getManifest();
    }

    return obj;
  },

  getManifest: function(){
    var grouped = utils.invoke( this.orderItems, 'toJSON' ).map( function( item ){
      var mitem = utils.pick( item, [
        'id', 'name', 'quantity', 'notes', 'item_id'
      ]);

      mitem.recipients = item.recipient ? [ item.recipient ] : [];

      mitem.options_sets = item.options_sets.map( function( set ){
        var options = set.options.filter( function( o ){
          return o.state;
        });

        if ( options.length === 0 ) options.push('None Selected');

        return {
          name:     set.name
        , options:  options
        }
      });

      return mitem;
    });

    grouped = utils.groupBy( grouped, 'item_id' );

    var itemsAreBasicallyTheSame = function( a, b ){
      if ( a.item_id !== b.item_id ) return false;
      if ( a.notes !== b.notes ) return false;
      if ( a.options_sets.length !== b.options_sets.length ) return false;

      for ( var i = 0, l = a.options_sets.length; i < l; i++ ){
        if ( a.options_sets[ i ].id !== b.options_sets[ i ].id ) return false;
        if ( a.options_sets[ i ].options.length !== b.options_sets[ i ].options.length ) return false;

        for ( var ii = 0, ll = a.options_sets[ i ].options.length; ii < ll; ii++ ){
          if ( a.options_sets[ i ].options[ ii ].name !== b.options_sets[ i ].options[ ii ].name ) return false;
        }
      }

      return true;
    };

    var consolidateGroup = function( group ){
      if ( group.length <= 1 ) return group;

      for ( var i = 1, l = group.length, g1, g2; i < l; i++ ){
        g1 = group[ i - 1 ];
        g2 = group[ i - 0 ];
        if ( !itemsAreBasicallyTheSame( g1, g2 ) ) continue;

        g1.quantity += g2.quantity;
        g1.recipients = g1.recipients.concat( g2.recipients );
        group.splice( i, 1 );

        // Since we removed group[i], do not advance `i`
        l--;
        i--;
      }

      return group;
    };

    Object.keys( grouped ).forEach( function( id ){
      grouped[ id ] = consolidateGroup( grouped[ id ] );
    });

    var manifest = Object.keys( grouped ).map( function( id ){
      return grouped[ id ];
    });

    manifest = utils.flatten( manifest );

    return manifest;
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
  },

  /**
   * determine if the user is allowed to change the value of the tip
   * @param  {object}  orderAuth {isAdmin: bool, isOwner: bool, isRestaurantManager: bool}
   * @return {Boolean}           editability
   */
  isTipEditable: function(orderAuth) {
    // Is the tip editable? This is the question. This is the criteria.
    //
    // 1. If the order has been canceled or rejected it is not editable.
    //
    // 2. If it is 3 days past the delivery date it is no editable.
    //
    // 3. If the tip is not 0 then the restaurant cannot edit it.
    //
    // 4. If it is before the delivery date then it is editable by the
    // owner and the admin.
    //
    // 5. If it is past the delivery date it is editable by the client,
    // admin, and restaurant manager.
    //
    // 6. If the order has been copied and thus datetime is undefined. Note:
    // certain fields are not copied such as datetime, tip, tip_amount.

    var now = moment();
    var deliveryDateTime = moment.tz(this.attributes.datetime, this.attributes.timezone);
    var cutOffDateTime = moment.tz(this.attributes.datetime, this.attributes.timezone).add(3, 'days');

    if (utils.contains(['canceled', 'rejected'], this.attributes.status)) return false;
    if (now > cutOffDateTime) return false;
    if (this.attributes.tip > 0 && orderAuth.isRestaurantManager) return false;

    if (now < deliveryDateTime && (orderAuth.isAdmin || orderAuth.isOwner)) return true;
    if (
      (now > deliveryDateTime)
      && (now < cutOffDateTime)
      && (orderAuth.isAdmin || orderAuth.isOwner || orderAuth.isRestaurantManager)
    ) return true;

    if (this.attributes.datetime === null) return true;

    return false;
  },

  createCopy: function(callback) {
    if (this.attributes.id == null) return callback(null, null);
  // with o as (select user_id, restaurant_id, street, city, state, zip, phone, notes, timezone, guests, adjustment_amount, adjustment_description, tip from orders where id=7)
// insert into orders (user_id, restaurant_id, street, city, state, zip, phone, notes, timezone, guests, adjustment_amount, adjustment_description, tip, review_token) select o.*, 'fake_token' from o;

  // with pastiche as (select o.item_id, o.quantity, o.notes, o.options_sets, i.name, i.description, i.price, i.feeds_min, i.feeds_max from order_items o inner join items i on (o.item_id = i.id) where order_id=7)
  // insert into order_items (item_id, quantity, notes, options_sets, name, description, price, feeds_min, feeds_max, order_id) select pastiche.*, 9 from pastiche returning *;

    var copyableColumns = ['user_id', 'restaurant_id', 'street', 'city', 'state', 'zip', 'phone', 'notes', 'timezone', 'guests', 'adjustment_amount', 'adjustment_description', 'tip', 'payment_method_id'];
    var self = this;
    var tasks = [
      function(cb) {
        pg.connect(config.postgresConnStr, cb)
      },

      function(client, done, cb) {
        client.query('BEGIN', function(err, result) {
          cb(err, client, done);
        });
      },

      function(client, done, cb) {
        // Step 1: Create the new order from the existing one.
        var copyOrder = {
          with: {
            old: {
              type: 'select',
              table: self.constructor.table,
              columns: copyableColumns,
              where: {id: self.attributes.id}
            }
          },
          columns: copyableColumns.concat('review_token'),
          expression: {
            type: 'select',
            table: 'old',
            columns: ['*', "('" + uuid.v4() + "')"]
          }
        }

        self.constructor.create(copyOrder, function(err, newOrders) {
          if (err) return cb(err, client, done);
          var newOrder = newOrders && newOrders.length > 0 ? newOrders[0] : null;
          return cb(null, client, done, newOrder);
        }, client);
      },

      function(client, done, newOrder, cb) {
        // Step 2: Copy the order items
        if (newOrder == null) return cb(null, client, done, null);

        newOrder.attributes.status = 'pending';
        var copyOrderItems = {
          with: {
            newItems: {
              type: 'select',
              table: require('./order-item').table,
              columns: [
                {table: 'order_items', name: 'item_id'},
                {table: 'order_items', name: 'quantity'},
                {table: 'order_items', name: 'notes'},
                {table: 'order_items', name: 'options_sets'},
                {table: 'items', name: 'name'},
                {table: 'items', name: 'description'},
                {table: 'items', name: 'price'},
                {table: 'items', name: 'feeds_min'},
                {table: 'items', name: 'feeds_max'}
              ],
              joins: {
                items: {
                  type: 'inner',
                  on: {id: '$order_items.item_id$'}
                }
              },
              where: {order_id: self.attributes.id}
            }
          },

          columns: ['item_id', 'quantity', 'notes', 'options_sets', 'name', 'description', 'price', 'feeds_min', 'feeds_max', 'order_id'],
          expression: {
            type: 'select',
            table: 'newItems',
            columns: ['*', "('" + newOrder.attributes.id +  "')"]
          }
        };

        require('./order-item').create(copyOrderItems, function(err, newOrderItems) {
          if (err) return cb(err, client, done);
          newOrder.orderItems = newOrderItems;

          return cb(null, client, done, newOrder);
        }, client);
      },

      function(client, done, newOrder, cb) {
        // Step 3: check if any order_items are missing because their items have been discontinued
        if (newOrder == null) return cb(null, client, done, null);
        self.getOrderItems(function(err, oldOrderItems) {
          if (err) return cb(err, client, done);
          var lostItems = utils.filter(oldOrderItems, function(old) { return old.attributes.item_id === null; });
          return cb(null, client, done, newOrder, lostItems.length > 0 ? lostItems : null);
        }, client);
      }
    ];

    utils.async.waterfall(tasks, function(err, client, done, order, lostItems) {
      client.query(err ? 'ROLLBACK' : 'COMMIT', function(error, rows, result) {
        done();
        return callback(error || err, order, lostItems);
      });
    });
  },

  setPaymentPaid: function (type, uri, data, callback) {
    var self = this;

    var TAGS = ['order-set-payment-paid'];
    logger.models.info(TAGS, 'setting payment status to paid for order: ' + this.attributes.id);

    db.getClient(function (error, client, done) {
      var tasks = {
        begin: function (cb) {
          client.query('BEGIN', cb);
        }
      , updatePaymentStatus: function (cb) {
          self.attributes.payment_status = 'paid';
          self.save(cb, client);
        }
      , createTransaction: function (cb) {
          var query = queries.transaction.createIfUriNotExists(type, self.attributes.id, uri, data);
          var sql = db.builder.sql(query);
          client.query(sql.query, sql.values, cb);
        }
      };

      utils.async.series([
        tasks.begin
      , tasks.updatePaymentStatus
      , tasks.createTransaction
      ], function (error, results) {
        client.query(error ? 'ROLLBACK' : 'COMMIT', function(e, rows, result) {
          done();
          return callback(e || error);
        });
      });
    });
  },

  setPaymentError: function (requestId, data, callback) {
    var self = this;

    var TAGS = ['order-set-payment-error'];
    logger.models.info(TAGS, 'setting payment status to error for order: ' + this.attributes.id);

    db.getClient(function (error, client, done) {

      var tasks = {
        begin: function (cb) {
          client.query('BEGIN', cb);
        }
      , updatePaymentStatus: function (cb) {
          self.attributes.payment_status = 'error';
          self.save(cb, client);
        }
      , createTransactionError: function (cb) {
          var transactionError = new TransactionError({
            order_id: self.attributes.id
          , request_id: requestId
          , data: data
          });
          transactionError.save(cb, client);
        }
      };

      utils.async.series([
        tasks.begin
      , tasks.updatePaymentStatus
      , tasks.createTransactionError
      ], function (error, results) {
        client.query(error ? 'ROLLBACK' : 'COMMIT', function(e, rows, result) {
          done();
          return callback (e || error);
        });
      });
    });
  }
}, {
  table: 'orders',

  find: function (query, callback) {
    // TODO: alter query to add latest status

    // query.order needs orders.id in order for distinct to work properly, this
    // messes with the user passing in a query object with different options.

    // TODO: It doesn't make sense to embed all this in the find function.
    // We should put this logic in another function or move it up to the code
    // that wants to execute such a query. The problem is that find is starting
    // to make too many assumptions about data you want back, and is limiting
    // your ability to actually control that.

    query = query || {};
    query.columns = query.columns || ['*'];
    query.order = query.order || ["submitted.created_at DESC", "orders.created_at DESC"];
    query.with = query.with || [];
    query.where = query.where || {};

    // distinct should have the same columns used in order by
    query.distinct = query.distinct || queryTransform.stripColumn(query.order);

    // making datetime a string on purpose so that the server timezone isn't
    // applied to it when it is pulled out (there is no ofset set on this
    // because it cannot be determined due to DST until the datetime in
    // datetime)
    query.columns.push('(orders.datetime::text) as datetime');
    query.with = query.with.concat([
      {
        name: 'day_hours'
      , type: 'select'
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
      }
    , {
        name: 'dt'
      , type: 'select'
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
      , table: 'day_hours'
      , groupBy: 'restaurant_id'
      }
    , {
        name: 'lead_times_json'
      , type: 'select'
      , table: 'restaurant_lead_times'
      , columns: [
          'restaurant_id'
        , {
            type: 'function'
          , function: 'array_to_json'
          , as: 'lead_times'
          , expression: {
              type: 'function'
            , function: 'array_agg'
            , expression: '(\'{"lead_time": \' || lead_time || \', "max_guests": \' || max_guests || \', "cancel_time": \' || coalesce(cancel_time::text::json, \'null\'::json) || \'}\')::json order by max_guests ASC'
            }
          }
        ]
      , groupBy: 'restaurant_id'
      }
    , {
        name: 'max_guests'
      , type: 'select'
      , columns: ['restaurant_id', 'max(max_guests) as max_guests']
      , groupBy: 'restaurant_id'
      , table: 'restaurant_lead_times'
      }
    , {
        name: 'statuses'
      , type: 'select'
      , table: 'order_statuses'
      , columns: ['order_id', 'status', 'created_at', 'max(created_at)']
      , over: {partition: 'order_id'}
      }
    , {
        name: 'submitted'
      , type: 'select'
      , table: 'order_statuses'
      , columns: ['order_id', 'created_at', 'max(created_at)']
      , over: {partition: ['order_id', 'status']}
      , where: {status: 'submitted'}
      }
    ]);

    var itemSubtotals = [
      {
        "name": "sets"
      , "type": "select"
      , "table": "order_items"
      , "columns": [
          {"name": "id", "as": "order_item_id"}
        , "json_array_elements(options_sets) AS set"
        ]
      }
    , {
        "name": "options"
      , "type": "select"
      , "table": "sets"
      , "columns": [
          "order_item_id"
        , "json_array_elements(set->'options') AS option"
        ]
      }
    , {
        "name": "selected_options"
      , "type": "select"
      , "table": "options"
      , "columns": ["*"]
      , "where": { "$custom": [" (option->>'state')::bool "] }
    }
    , {
        "name": "subtotals"
      , "type": "select"
      , "table": "order_items"
      , "columns": [
          {"table": "order_items", "name": "id", "as": "order_item_id"}
        , {"table": "order_items", "name": "order_id"}
        , "(quantity * (price + coalesce(sum((option->>'price')::int), 0))) as sub_total"
        ]
      , "joins": {
          "selected_options": {
            "type": "left",
            "on": {"order_item_id": "$order_items.id$"}
          }
        }
      , "groupBy": ["order_items.id", "order_items.quantity", "order_items.price", "order_items.order_id"]
      }
    , {
        "name": "order_subtotals"
      , "type": "select"
      , "table": "orders"
      , "joins": {
          "subtotals": {
            "type": "left"
          , "on": {"order_id": "$orders.id$"}
          }
        }
      , "columns": [
          {"table": "orders", "name": "id", "as": "order_id"}
        , "coalesce(sum(subtotals.sub_total), 0) + coalesce(orders.adjustment_amount, 0) AS sub_total"
        ]
      , "groupBy": ["orders.id", "orders.adjustment_amount"]
      }
    ];

    query.with.push.apply(query.with, itemSubtotals);

    query.joins = query.joins || {};

    query.columns.push('statuses.status');

    query.joins.statuses = {
      type: 'left'
    , on: {
        'order_id': '$orders.id$'
      , 'created_at': '$statuses.max$'
      }
    };

    query.columns.push({"table": "order_subtotals", "name": "sub_total"});

    query.joins.order_subtotals = {
      type: 'left'
    , on: {'order_id': '$orders.id$'}
    };

    query.columns.push({table: 'restaurants', name: 'name', as: 'restaurant_name'});
    query.columns.push(
      module.exports.prototype.getDeliveryFeeQuery.call({
        attributes: {
          restaurant_id: query.where.restaurant_id || '$orders.restaurant_id$'
        , zip: '$orders.zip$'
        }
      })
    );
    query.columns.push('restaurants.minimum_order');
    query.columns.push({table: 'restaurants', name: 'balanced_customer_uri', as: 'restaurant_balanced_customer_uri'});

    query.joins.restaurants = {
      type: 'inner'
    , on: {'id': '$orders.restaurant_id$'}
    };

    query.columns.push("(SELECT array(SELECT zip FROM restaurant_delivery_zips WHERE restaurant_id = orders.restaurant_id)) AS delivery_zips");
    query.columns.push('hours.delivery_times');
    query.columns.push('lead_times_json.lead_times');
    query.columns.push("max_guests.max_guests");

    var contactsInfo = ['sms_phones', 'voice_phones', 'emails'];
    contactsInfo.forEach( function(type){
      query.columns.push(Restaurant.getContactsInfo(type));
    });

    query.joins.max_guests = {
      type: 'left'
    , on: { 'orders.restaurant_id': '$max_guests.restaurant_id$' }
    };

    query.joins.hours = {
      type: 'left'
    , target: 'dt'
    , on: { 'orders.restaurant_id': '$hours.restaurant_id$' }
    }

    query.joins.lead_times_json = {
      type: 'left'
    , on: { restaurant_id: '$orders.restaurant_id$' }
    }

    query.columns.push('(submitted.created_at) as submitted');

    query.joins.submitted = {
      type: 'left'
    , on: {'order_id': '$orders.id$', 'created_at': '$submitted.max$'}
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
    var caseIsBadGuests = '(CASE '
      + ' WHEN (orders.guests IS NULL) THEN NULL'
      + ' WHEN (max_guests.restaurant_id IS NULL) THEN FALSE'
      + ' ELSE orders.guests > max_guests.max_guests'
      + ' END)'
    ;

    query.columns.push(caseIsBadGuests+' AS is_bad_guests');

    // check lead time
    var leadTimes = [{
      "name": "sub_lead_times"
    , "type": "select"
    , "columns": [
        { name: 'id', alias: 'order_id' }
      , { name: 'max_guests', table: 'rlt' }
      , { name: 'lead_time', table: 'rlt' }
      , "min(max_guests) OVER (PARTITION by orders.id)"
      ]
    , "table": "orders"
    , "joins": {
        rlt: {
          type: 'left'
        , target: 'restaurant_lead_times'
        , on: {
            restaurant_id: '$orders.restaurant_id$'
          }
        }
      }
    , "where": {
        "rlt.max_guests": { $gte: '$orders.guests$' }
      }
    },

    {
      "name": "order_lead_times"
    , "type": "select"
    , "columns": [
        "order_id"
      , "max_guests"
      , "lead_time"
      ]
    , "table": "sub_lead_times"
    , "where": {
        "max_guests": "$sub_lead_times.min$"
      }
    }];

    query.with.push.apply(query.with, leadTimes);

    query.joins.order_lead_times = {
      type: 'left'
    , on: {
        'orders.id': '$order_lead_times.order_id$'
      }
    };

    var caseIsBadLeadTime = '(CASE '
      + ' WHEN (orders.datetime IS NULL) THEN NULL'
      + ' WHEN (order_lead_times.order_id IS NULL) THEN FALSE'
      + ' ELSE "order_lead_times"."lead_time" > EXTRACT(EPOCH FROM ("orders"."datetime" - (now() AT TIME ZONE "orders"."timezone"))/3600)'
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

    query.columns.push({table: 'users', name: 'email', as: 'user_email'});
    query.columns.push({table: 'users', name: 'organization'});
    query.columns.push({table: 'users', name: 'name', as: 'user_name'});
    query.columns.push({table: 'users', name: 'balanced_customer_uri', as: 'user_balanced_customer_uri'});

    query.joins.users = {
      type: 'inner'
    , on: {id: '$orders.user_id$'}
    }

    var caseIsBadDeliveryTime = '(CASE '
      + ' WHEN (orders.datetime IS NULL) THEN NULL'
      + ' WHEN (delivery_times.restaurant_id IS NULL) THEN TRUE'
      + ' ELSE FALSE'
      + ' END)'
    ;

    query.columns.push(caseIsBadDeliveryTime+' AS is_bad_delivery_time');

    query.limit = 10000;

    // Add order submitted_date column logic
    if (query.columns.indexOf('submitted_date') > -1){
      query.columns[ query.columns.indexOf('submitted_date') ] = {
        table: 'os_submitted'
      , name: 'created_at'
      , as: 'submitted_date'
      };

      query.joins.os_submitted = {
        type: 'left'
      , on: { status: 'submitted', order_id: '$orders.id$' }
      , target: {
          type: 'select'
        , table: 'order_statuses'
        }
      };

      // Reduce the sub-query set if we can
      if ('id' in query.where){
        query.joins.os_submitted.target.where = { order_id: query.where.id };
      }
    }

    // query.columns.push('(is_bad_zip OR is_bad_guests OR is_bad_lead_time OR is_bad_delivery_time AS is_unacceptable)');

    Model.find.call(this, query, utils.partial(modifyAttributes, callback));
  },

  findReadyForCharging: function (limit, callback) {
    if (typeof limit === 'function') {
      callback = limit;
      limit = 100;
    }
    // it is ready for charging 3 days after the order has been delivered.
    var query = {
      where: {
        payment_method_id: {$notNull: true}
      , payment_status: {$null: true}
      , status: 'accepted'
      , $custom: ['now() > (("orders"."datetime" AT TIME ZONE "orders"."timezone") + interval \'3 days\')']
      }
    , limit: limit
    };

    Model.find.call(this, query, utils.partial(modifyAttributes, callback));
  },

  setPaymentStatusPendingIfNull: function (ids, callback) {
    if (typeof ids === 'number') ids = [ids];

    var query = {
      updates: {
        payment_status: 'pending'
      }
    , where: {
        payment_status: {$null: true}
      , id: {$in: ids}
      }
    };

    Model.update.call(this, query, utils.partial(modifyAttributes, callback));
  },

  findReadyForAwardingPoints: function (options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    // it is ready for awarding 3 days after the order has been delivered.
    var query = {
      where: {
        status: {$or: ['accepted', 'delivered']}
      , points_awarded: false
      , $custom: ['now() > (("orders"."datetime" AT TIME ZONE "orders"."timezone") + interval \'3 days\')']
      }
    };

    utils.deepExtend(query, options);

    this.find(query, callback);
  },

  findTomorrow: function( query, callback ){
    if ( typeof query === 'function' ){
      callback = query;
      query = {};
    }

    utils.defaults( query.where = query.where || {}, {
      datetime: {
        $between_days_from_now: { from: 1, to: 2, timezone: 'orders.timezone' }
      }
    });

    module.exports.find.call( this, query, callback );
  },

  /**
   * Find orders filtered by status
   *
   * @param {object} query - The query object (optional)
   * @param {string|array} status - The order status to filter by
   * @param {function} callback - The callback function(error, orders)
   */
  findByStatus: function( query, status, callback ){
    if ( typeof query === 'string' ){
      callback = status;
      status = query;
      query = {};
    }

    query = utils.defaults(query, {
      order: 'id desc'
    , where: {}
    });

    if (typeof status === 'string') {
      switch (status) {
        case 'accepted':
          // sort by date accepted
          query.with = [{
            name: 'latest_order_statuses'
          , type: 'select'
          , table: 'order_statuses'
          , columns: [
              'order_id'
            , 'status'
            , { name: 'created_at', alias: 'status_date' }
            ]
          , order: [
              'order_id desc'
            , 'created_at desc'
            ]
          , distinct: ['order_id']
          }];

          query.joins = query.joins || {};
          query.joins.latest_order_statuses = {
            type: 'left'
          , on: {
              'order_id': '$orders.id$'
            }
          };

          query.where.status = status;
          query.order = ['status_date desc'];
          break;
        case 'pending':
        case 'canceled':
        case 'submitted':
        case 'denied':
        case 'delivered':
          query.where.status = status;
          break;
        default:
          break;
      };
    } else {
      query.where.status = {$in: status};
    }

    module.exports.find.call( this, query, callback );
  },

  // this is a FSM definition
  statusFSM: {
    canceled: [],
    pending: ['canceled', 'submitted'],
    submitted: ['canceled', 'denied', 'accepted'],
    denied: [],
    accepted: ['canceled', 'delivered'],
    delivered: []
  },

  statuses: [
    'pending'
  , 'canceled'
  , 'submitted'
  , 'denied'
  , 'accepted'
  , 'delivered'
  ]
});
