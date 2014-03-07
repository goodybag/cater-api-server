var utils = require('../utils');
var models = require('../models');
var moment = require('moment');
var fs = require('fs');
var range = process.argv.slice(2);
var start = range[0] || '2012-01-01';
var end = range[1] || moment().format('YYYY-MM-DD');

console.log('Generating list of accepted orders delivered from', start, 'to', end);
var filename = 'accepted-orders-' + start+'-'+end+'.csv';
console.log('Writing to ',filename);
var writeStream = fs.createWriteStream(filename);

var query = {
  where: {
    status: 'accepted'
  , datetime: {
      $gte: start
    , $lte: end
    }
  }
};

var wrap = function(str, wrapper) {
  wrapper = wrapper || '"';
  return str ? wrapper+str+wrapper : '';
}

var dollars = function(val) {
  return (val / 100.0).toFixed(2);
}

writeStream.write([
  'Order Number'
, 'Order Date'
, 'Delivery Date'
, 'Subtotal'
, 'Delivery Fee'
, 'Tax'
, 'Tip'
, 'Total'
, 'Restaurant Name'].join(',')+'\n');

models.Order.find(query, function(err, results) {
  utils.each(results, function(order) {
    order = order.attributes;
    writeStream.write(utils.map([
      order.id
    , moment(order.created_at).format('MM-DD-YYYY hh:mm a')
    , moment(order.datetime).format('MM-DD-YYYY hh:mm a')
    , dollars(order.sub_total)
    , dollars(order.restaurant.delivery_fee)
    , dollars( (order.sub_total + order.restaurant.delivery_fee) * 0.0825)
    , dollars(order.tip)
    , dollars(order.total)
    , order.restaurant.name
    ], function(val) { return wrap(val); }).join(',')+'\n');
  });
});
