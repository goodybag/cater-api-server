var utils = require('./utils');
var models = require('./models');
var moment = require('moment');

models.Order.find({
  where: { status: 'accepted' }
, order: 'id asc'
}, function( error, results ){

  console.log('Order Number, Order Date, Delivery Date, Subtotal, Delivery Fee, Tax, Tip, Total, Restaurant Name');
  utils.each(results, function(r) {
    r = r.attributes;
    // console.log(r);
    console.log([
      r.id
    , moment(r.created_at).format('MM-DD-YYYY hh:mm a')
    , moment(r.datetime).format('MM-DD-YYYY hh:mm a')
    , (r.sub_total / 100.0).toFixed(2)                         // subtotal
    , (r.restaurant.delivery_fee / 100.0).toFixed(2)     // delivery fee
    , ( (r.sub_total + r.restaurant.delivery_fee) / 100.0 * 0.082500 ).toFixed(2)          // tax
    , (r.tip / 100.0).toFixed(2)                         // tip
    , (r.total /100.0).toFixed(2)                        // total
    , r.restaurant.name
      ].join(','));
  });
});
