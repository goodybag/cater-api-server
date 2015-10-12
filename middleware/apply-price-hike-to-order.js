/**
 * Applies the price hike logic to an order on the
 * request object.
 */

var Orders = require('stamps/orders');

module.exports = function( options ){
  return function( req, res, next ){
    req.order.items = req.order.orderItems;

    var order = Orders.create( req.order );

    res.locals.order.total = order.getTotal();
    res.locals.order.sub_total = order.getPriorityAccountSubTotal();
    res.locals.order.sales_tax = order.getTax();
    res.locals.order.orderItems = order.getItems();

    res.locals.order.orderItems.forEach( function( item ){
      item.sub_total = item.getTotal();
    });

    return next();
  };
};