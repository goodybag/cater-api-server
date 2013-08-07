var db = require('../../db');
var queryies = require('../../db/queries');
var errors = require('../../errors');
var utils = require('../../utils');


module.exports.list = function(req, res) {
  var inputs = utils.pick(JSON.parse(req.query), ['columns', 'limit', 'offset']);
  var query = queries.user.list(inputs.columns, inputs.limit, inputs.offset);

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(results);
  });
}

module.exports.create = function(req, res) {
  var flow = {
    encrypt: function(callback) {
      utils.encryptPassword(req.body.password, function(error, hash, salt) {
        if (error) res.send(errors.internal.UNKNOWN, error);
        return callback(error, hash);
      });
    }
  , create: function(hash, callback) {
      var query queries.user.create({
        first_name: req.body.first_name
      , last_name: req.body.last_name
      , email: req.body.email.toLowerCase()
      , password: hash
      , organization: req.body.organization
      });

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

module.exports.get = function(req, res) {
  var inputs = JSON.parse(req.query);
  var query = queries.user.get(inputs.columns);

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(results);
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
