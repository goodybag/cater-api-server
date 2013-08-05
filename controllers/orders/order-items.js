var models = require('../../models');
var errors = require('../../errors');
var utils  = require('../../utils');

module.exports.list = function(req, res, next) {
  var query = utils.extend({where: {}}, req.qurey);
  utils.extend(query.where, {'order_id': req.params.oid});
  models.OrderItem.find(query, function(err, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(utils.invoke(results, 'toJSON'));
  });
}

module.exports.get = function(req, res, next) {
  models.OrderItem.findOne(parseInt(req.params.iid), function(err, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(result ? result.toJSON() : 404);
  });
}
