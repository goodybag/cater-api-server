var db = require('../../db');
var queries = require('../../db/queries');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');


module.exports.list = function(req, res) {
  var query = queries.user.list(req.query.columns, req.query.limit, req.query.offset);
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(error, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(results);
  });
}

module.exports.get = function(req, res) {
  var query = queries.user.get(req.params.uid, req.query.columns);
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(error, rows, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!rows || !rows[0]) return res.status(404).render('404');
    res.render('user', {user: rows[0]}, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      return res.send(200, html);
    });
  });
}

module.exports.create = function(req, res) {
  var flow = {
    encrypt: function(callback) {
      utils.encryptPassword(req.body.password, function(error, hash, salt) {
        if (error) res.error(errors.internal.UNKNOWN, error);
        return callback(error, hash);
      });
    }
  , create: function(hash, callback) {
      var groups = req.body.groups || ['client'];
      var userData = utils.extend(req.body, {email: req.body.email.toLowerCase(), password: hash});
      var query = queries.user.create(utils.omit(userData, 'groups'));

      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results){
        if (error) {
          res.error(parseInt(error.code) === 23505 ? errors.registration.EMAIL_TAKEN : errors.internal.DB_FAILURE, error, callback);
          return callback(error);
        }
        var user = results[0];
        return callback(null, user, groups);
      });
    }
  , group: function(user, groups, callback) {
      groups = utils.map(groups, function(group) {
        return { user_id: user.id, group: group };
      });
      var query = queries.user.setGroup(groups);
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results){
        if (error) return res.error(errors.internal.DB_FAILURE, error);
        return res.send(204);
      });
    }
  }

  utils.async.waterfall([flow.encrypt, flow.create, flow.group]);
}

module.exports.update = function(req, res) {
  // TODO: require auth header with old password for password update
  if (!req.body.password) delete req.body.password; // Strip null passwords
  var update = function() {
    var query = queries.user.update(req.body, req.params.uid);
    var sql = db.builder.sql(query);
    db.query(sql.query, sql.values, function(err, rows, result) {
      if (err) return res.error(parseInt(err.code) === 23505 ? errors.registration.EMAIL_TAKEN : errors.internal.DB_FAILURE, err);
      res.render('user', {user: rows[0], alert: true}, function(err, html) {
        if (err) return res.error(errors.internal.UNKNOWN, err);
        return res.send(200, html);
      });
    });
  }
  req.body.password == null ? update() : utils.encryptPassword(req.body.password, function(err, hash, salt) {
    if (err) return res.error(errors.internal.UNKNOWN, err);
    req.body.password = hash;
    update();
  });
}

// TODO: we don't really want to delete uses.  come up with some sort of deactivate user account thing.
module.exports.del = function(req, res) {
  var query = queries.user.del(parseInt(req.params.id));

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.noContent();
  });
}

module.exports.listOrders = function(req, res) {
  models.Order.find({where: {user_id: req.params.uid}}, function(err, orders) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.render('user-orders', {orders: utils.invoke(orders, 'toJSON')}, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      res.send(html);
    });
  });
}

module.exports.createSessionAs = function(req, res) {
  var query = queries.user.get(req.params.uid, req.query.columns);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (rows.length === 0) return res.send(404);
    var user = rows[0];
    req.session = utils.extend({}, req.session, {user: utils.pick(user, ['id', 'groups', 'email'])});
    res.redirect(req.query.next || '/restaurants');
  });
};

module.exports.passwordResets = require('./password-resets');
module.exports.addresses = require('./addresses');
