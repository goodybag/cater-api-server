var db = require('../../db')
  , queries = require('../../db/queries')
  , errors = require('../../errors')
  , utils = require('../../utils')
  , config = require('../../config')
  , Address = require('../../models/address');

module.exports.create = function(req, res, next) {
  next();
};

module.exports.list = function(req, res, next) {
  var query = { 
    where: {
      user_id: req.params.uid 
    }
  };
  Address.find(query, function(error, addresses) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('addresses', { addresses: utils.invoke(addresses, 'toJSON') });
  });
};

module.exports.get = function(req, res, next) {
  next();
};

module.exports.update = function(req, res, next) {
  // Todo: If 'default' remove from others 
  next();
};

module.exports.del = function(req, res, next) {
  next();
};