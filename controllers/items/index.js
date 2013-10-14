var uuid = require('node-uuid');
var models = require('../../models');
var errors = require('../../errors');
var utils  = require('../../utils');
var db     = require('../../db');
var queries = require('../../db/queries');

module.exports.list = function(req, res, next) {
  models.Item.find(req.query, function(err, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.json(utils.invoke(results, 'toJSON'));
  });
}

module.exports.get = function(req, res, next) {
  models.Item.findOne(parseInt(req.params.id), function(err, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.json(result ? result.toJSON() : 404);
  });
}

module.exports.update = function(req, res) {
  // insert uuids for every options set and option
  // will not override id field if already present
  var ops = JSON.stringify(utils.map(req.body.options_sets, utils.compose(function(set) {
    // ids for options
    return utils.extend(set, {options: utils.map(set.options, function(option) {
      return utils.extend({id: uuid.v4()}, option);
    })});
  }, function(set) {
    // ids for options sets
    return utils.extend({id: uuid.v4()}, set);
  })));

  var body = req.body.options_sets != null ? utils.extend(req.body, {options_sets: ops}) : req.body;

  var query = queries.item.update(req.body, req.params.id);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, error);
    res.json(200, rows[0]);
  });
}

module.exports.remove = function(req, res) {
  var query = queries.item.del(req.params.id);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, error);
    res.json(204);
  });
}
