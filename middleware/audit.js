var db = require('../db');
var utils = require('../utils');

/**
 * Audit Middleware handles inserting audit records
 *
 * Don't block response for auditing
 * Just log an error if it comes up
 */

module.exports = {
  orderType: function(options) {
    options = utils.defaults({}, options, {
      param: 'id'
    });

    return function(req, res, next) {
      var logger =  req.logger.create('AuditOrderType');

      if ( !req.body.type ) return next();

      db.order_types.insert({
        order_id:     req.order ? req.order.id : req.params[options.param]
      , user_id:      req.user ? req.user.attributes.id : null
      , type:         req.body.type
      },
      function(err) {
        if ( err ) logger.error(err instanceof Error ? err.toString() : err);
      });
      next();
    };
  }
};
