/**
 * Middleware for authenticating delivery service requests
 * by a `ds_token`
 */
module.exports = function(opts) {
  return function(req, res, next) {
    opts = opts || {};
    var name = opts.name || 'ds_token';
    var auth = req.query[name] &&
               res.locals.order &&
               req.query[name] === res.locals.order.ds_token;
    if ( !auth ) {
      return res.send(400, 'Invalid Token: Please contact support@goodybag.com for assistance' );
    }
    next();
  }
}