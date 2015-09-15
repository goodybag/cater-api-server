/*
* item-price.js
* syncs order_item and item prices
*
*/

var db = require('../../../db');
var logger  = require('../../../lib/logger').create('Synchronize-Item-Price');
var utils = require('../../../utils');

var getQuery = function () {
  var query = {
    type: 'select'
  , table: 'orders_items'
  , columns: [
    '*'
    , { name: 'items.price', alias: 'item_price' }
    ]
  , with: {
      orders_items: {
        type: 'select'
      , table: 'order_items'
      , columns: [
          { name: 'orders.id', alias: 'order_id' }
        , { name: 'order_items.id', alias: 'order_item_id' }
        , { name: 'order_items.item_id', alias: 'item_id' }
        , { name: 'order_items.price', alias: 'price' }
        , { name: 'order_items.name', alias: 'name' }
        ]
      , joins: [
          {
            type: 'inner'
          , target: 'orders'
          , on: { id: '$order_items.order_id$' }
          }
        ]
      , where: {
          'orders.status': 'pending'
        , $gte: { 'orders.datetime': 'now()' }
        }
      }
    }
  , joins: [
      {
        type: 'left'
      , target: 'items'
      , on: { id: '$orders_items.item_id$' }
      }
    ]
  , where: {
      $ne: { price: '$items.price$' }
    }
  };

  return query;
};

module.exports = function (callback) {
  return db.query2(getQuery(), function (error, items) {
    if (error) {
      logger.error('Error fetching item prices', {
        error: error
      });
      return process.exit(1);
    }

    logger.info('Processing', items.length, 'items');
    var onItem = function (item, next) {
      db.order_items.update({ id: item.order_item_id }, { price: item.item_price}, next);
    };

    return utils.async.each(items, onItem, callback);
  });
};
