var models = require('../../models');
var errors = require('../../errors');
var utils  = require('../../utils');

module.exports.list = function(req, res, next) {
  (new models.Order({id: req.oid})).getItems(function(err, items) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(utils.invoke(items, 'toJSON'));
  });
}

module.exports.get = function(req, res, next) {
  models.OrderItem.findOne(parseInt(req.params.iid), function(err, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(result ? result.toJSON() : 404);
  });
}
