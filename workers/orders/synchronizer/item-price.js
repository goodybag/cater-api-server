var db = require('../../../db');

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

db.query2(query, function (error, items) {
  if (error) return console.log(error);
  console.log(items);
});
