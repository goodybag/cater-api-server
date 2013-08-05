var
  db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  models.Restaurant.find(req.query, function(error, models) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('businesses', {businesses: utils.invoke(models, 'toJSON')}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      res.render('index', {content: html}, function(errror, html) {
        if (error) return res.error(errors.internal.UNKNOWN, error);
        res.send(html);
      });
    });
  });
}

module.exports.get = function(req, res) {
  models.Restaurant.findOne(parseInt(req.params.rid), function(error, response) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!response) return res.send(404);
    response.getItems(function(err, items) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      res.send(response.toJSON());
    });
  });
}

module.exports.listItems = function(req, res) {
  (new models.Restaurant({id: req.params.rid})).getItems(function(err, items) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(utils.invoke(items, 'toJSON'));
  });
}
