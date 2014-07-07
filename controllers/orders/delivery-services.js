var db = require('../../db');

module.exports.accept = function(req, res) {
  if ( !res.locals.order ) return res.send(400, 'Order could not be found');
  if ( res.locals.order.ds_token_used ) return res.send(400, 'You have already accepted this order, no further action needed!');

  db.orders.update(res.locals.order.id, { ds_token_used: 'now()' }, function(err) {
    if ( err ) return res.send(400, 'Could not update order');
    res.render('delivery-service/accepted');
  });
};
