var
  db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  models.Order.find(req.query, function(error, models) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(utils.invoke(models, 'toJSON'));
  });
}

module.exports.get = function(req, res) {
  models.Order.findOne(parseInt(req.params.id), function(error, response) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(response ? response.toJSON() : 404);
  });
}