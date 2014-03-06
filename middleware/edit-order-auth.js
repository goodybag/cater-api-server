/**
 * Middleware for authenticating individual ordering
 */

var models = require('../models');
var utils = require('../utils');

module.exports = function(req, res, next) {
  var token = req.query.edit_token || req.body.edit_token;
  delete req.body.edit_token;

  if ( !token ) return next();

  var query = {
    where: {
      edit_token: token
    , edit_token_expires: { $gte: 'now()' }
    }
  };

  models.Order.findOne(query, function(err, order) {
    if ( err ) return res.error(500);
    if ( !order ) return res.render(404);

    // record order creator id
    req.creatorId = order.attributes.user.id;
    res.locals.edit_token = token;
    next();
    
    // verify token
    // todo: check expiration
  });
};