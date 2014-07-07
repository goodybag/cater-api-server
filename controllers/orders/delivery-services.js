var db = require('../../db');

module.exports.accept = function(req, res) {
  if ( !res.locals.order ) return res.send(400, 'Order could not be found');
  db.orders.update(res.locals.order.id, { ds_token_used: 'now()' }, function(err) {
    if ( err ) return res.send(400, 'Could not update order');
    res.render('delivery-service/accepted');
  });
};