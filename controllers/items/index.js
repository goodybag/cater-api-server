var uuid = require('node-uuid');
var models = require('../../models');
var errors = require('../../errors');
var utils  = require('../../utils');
var db     = require('../../db');
var queries = require('../../db/queries');

var tags = function(body, id) {
  return utils.map(body.tags, function(obj, index, arr) {
    return {item_id: id, tag: obj};
  });
};

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

  // Let's update the item related tables in parallel
  var tasks = [];

  // TASK 1 - Recreate the tags for this item
  tasks.push(function(taskCallback) {
    // Ensure we delete before adding the req.body.tags back in
    if (req.body.tags === undefined) {
      return taskCallback(null);
    }
    var values = tags(req.body, req.params.id);
    var delQuery = queries.item.delTags(req.params.id);
    var createQuery = values.length > 0 ? queries.item.createTags(values) : null;
    utils.async.eachSeries([delQuery, createQuery], function(query, queryCallback) {
      if (!query) return queryCallback();
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, queryCallback);
    }, taskCallback);
  });

  // TASK 2 - Update this item
  tasks.push(function(cb) {
    // only need to update this item's columns
    var updates = utils.omit(req.body, 'tags');
    if (utils.size(updates) === 0) return cb();
    var query = queries.item.update(updates, req.params.id);
    var sql = db.builder.sql(query);
    db.query(sql.query, sql.values, function(err, rows, result) {
      return cb(err, rows && rows.length>0 ? rows[0] : null);
    });
  });

  // Run the tasks in parallelogram
  utils.async.parallel(tasks, function(err, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(200, utils.last(results));
  });
};

module.exports.remove = function(req, res) {
  var query = queries.item.del(req.params.id);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, error);
    res.json(204);
  });
}
