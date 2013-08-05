var models = require('../../models');
var errors = require('../../errors');
var utils  = require('../../utils');

module.exports.list = function(req, res, next) {
  models.Item.find(req.query, function(err, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(utils.invoke(results, 'toJSON'));
  });
}

module.exports.get = function(req, res, next) {
  models.Item.findOne(parseInt(req.params.id), function(err, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(result ? result.toJSON() : 404);
  });
}
