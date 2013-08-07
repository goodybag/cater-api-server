var
  db = require('../../db')
, queries = require('../../db/queries')
, errors = require('../../errors')
, utils = require('../../utils')
;

module.exports.get = function(req, res) {
  var query = queries.user.get(req.session.user.id);
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(err, rows, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!rows || !rows[0]) return res.send(404);
    res.json(200, rows[0]);
  });
}

module.exports.create = function(req, res) {
  var tasks = {
    comparePassword: function(callback) {
      var query = queries.user.get({email: req.body.email.toLowerCase()})

      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results) {
        if (error) return res.error(errors.internal.DB_FAILURE, error, callback);
        if (results.length != 1) return res.error(errors.auth.INVALID_EMAIL, error, callback);
        var user = results[0];
        utils.comparePasswords(req.body.password, user.password, function(error, success) {
          if (!success) return res.error(errors.auth.INVALID_PASSWORD, error, callback);
          req.session = utils.extend({}, req.session, {user: {id: user.id}});
          return callback();
        });
      });
    }
  , redirect: function(callback) {
      res.redirect(req.query.next || '/');
      return callback();
    }
  }

  utils.async.series(tasks);
}

module.exports.del = function(req, res) {
  req.session = null;
  return res.redirect(req.query.next || '/');
}
