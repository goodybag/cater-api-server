var db = require('../../db');
var queryies = require('../../db/queries');
var errors = require('../../errors');
var utils = require('../../utils');


module.exports.list = function(req, res) {
  var inputs = utils.pick(JSON.parse(req.query), ['columns', 'limit', 'offset']) || {};
  var query = queries.user.list(inputs.columns, inputs.limit, inputs.offset);

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(results);
  });
}

module.exports.get = function(req, res) {
  var inputs = JSON.parse(req.query) || {};
  var query = queries.user.get(inputs.columns);

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(results);
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
      var query queries.user.create(utils.extend(req.body, {email: req.body.email.toLowerCase(), password: hash}));

      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results){
        if (error) return res.error(parseInt(error.code) === 23505 ? errors.registration.EMAIL_TAKEN : errors.internal.DB_FAILURE, error, callback);
        var user = results[0];
        utils.extend(req.session, {user: {id: user.id}});
        return res.redirect('/');
      });
    }
  }

  utils.async.waterfall([flow.encrypt, flow.create]);
}

module.exports.update = function(req, res) {
  // TODO: require auth header with old password for password update
  var update = function() {
    var query = queries.user.update(req.body, req.params.uid);
    var sql = db.builder.sql(query);
    db.query(sql.query, sql.values, function(err, rows, result) {
      if (err) return res.error(parseInt(err.code) === 23505 ? errors.registration.EMAIL_TAKEN : errors.internal.DB_FAILURE, err);
      res.json(200, rows[0]);
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
