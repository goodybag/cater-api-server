var uuid = require('node-uuid');
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
    if (err) return res.error(errors.internal.UNKNOWN, err);
    res.send(201, rows[0]);
  });
}

module.exports.update = function(req, res) {
  var query = queries.category.update(req.body, req.params.cid);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, err);
    res.send(200, rows[0]);
  });
}

module.exports.remove = function(req, res) {
  var query = queries.category.del(req.params.cid);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, err);
    res.send(204);
  });
}

module.exports.listItems = function(req, res) {
  (new models.Category({id: req.params.cid})).getItems(function(err, items) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(utils.invoke(items, 'toJSON'));
  });
}

var tags = function(body, id) {
  return utils.map(body.tags, function(obj, index, arr) {
    return {item_id: id, tag: obj};
  });
};

module.exports.addItem = function(req, res) {
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

  // Insert new item and related tags in series
  var tasks = [];

  // Task 1 - Create the item
  tasks.push(function(taskCallback) {
    // Exclude tags for items insertion
    var properties = utils.omit(req.body, 'tags');
    var query = queries.item.create(properties, req.params.rid, req.params.cid);
    var sql = db.builder.sql(query);
    db.query(sql.query, sql.values, function(err, rows, result) {
      return taskCallback(err, rows && rows.length>0 ? rows[0] : null);
    });
  });

  // Task 2 - Create item tags
  tasks.push(function(item, taskCallback) {
    if (req.body.tags === undefined) return taskCallback(null, item);
    // Relate body tags to the new item id
    var values = tags(req.body, item.id);
    var query = values.length > 0 ? queries.item.createTags(values) : null;
    if (!query) return taskCallback(null, item);
    var sql = db.builder.sql(query);
    db.query(sql.query, sql.values, function(err, rows, result) {
      taskCallback(err, item, rows);
    });
  });

  utils.async.waterfall(tasks, function(err, item, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(201, item);
  });
};
