var utils = require('../utils');

module.exports = function( options ){
  return function(req, res, next) {
    var logger = req.logger.create('Middleware-OrderEditable');
    req.order.editable = req.user.isAdmin() || utils.contains(['pending', 'submitted'], req.order.status);
    logger.info('Order', req.order.editable ? 'Editable': 'Not editable' );
    next();
  };
};
