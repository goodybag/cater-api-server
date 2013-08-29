var db = require('../../db');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');
var queries = require('../../db/queries');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  var query = utils.extend({where: {}}, req.query);
  utils.extend(query.where, {'restaurant_id': req.params.rid});
  models.Category.find(query, function(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(utils.invoke(results, 'toJSON'));
  });
}

module.exports.get = function(req, res) {
  models.Category.findOne(parseInt(req.params.cid), function(error, response) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(response ? response.toJSON() : 404);
  });
}

module.exports.create = function(req, res) {
  var query = queries.category.create(req.body, req.params.rid);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, error);
    res.send(201, rows[0]);
  });
}

module.exports.update = function(req, res) {
  var query = queries.category.update(req.body, req.params.cid);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, error);
    res.send(200, rows[0]);
  });
}

module.exports.remove = function(req, res) {
  var query = queries.category.del(req.params.cid);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, error);
    res.send(200);
  });
}

module.exports.listItems = function(req, res) {
  (new models.Category({id: req.params.cid})).getItems(function(err, items) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(utils.invoke(items, 'toJSON'));
  });
}

module.exports.addItem = function(req, res) {
  var query = queries.item.create(req.body, req.params.cid);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, error);
    res.send(201, rows[0]);
  });
}
