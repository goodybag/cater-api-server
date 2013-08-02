var
  db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  models.Restaurant.find(req.query, function(error, response) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(response);
  });
}

module.exports.get = function(req, res) {
  models.Restaurant.findOne(parseInt(req.params.id), function(error, response) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(response);
  });
}

module.exports.listItems = function(req, res) {
  res.send(501);  //not implemented
}
