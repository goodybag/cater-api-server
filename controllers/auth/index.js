var
  async = require('async')
, db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

module.exports.index = function(req, res) {
  console.log(req.session);
  if (req.session && req.session.user && req.session.user.id != null)
    return res.redirect(req.query.next || '/');

  res.render('auth', function(error, html) {
    if (error) return res.error(errors.internal.UNKNOWN, error);
    res.render('index', {content: html}, function(errror, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      res.send(html);
    });
  });
}

module.exports.login = function(req, res) {
  var data = {
    error: null
  , email: req.body.email
  }

  var tasks = {
    comparePassword: function(callback) {
      var query = {
        type: 'select'
      , table: 'users'
      , columns: ['id', 'email', 'password']
      , where: {email: req.body.email.toLowerCase()}
      }

      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results) {
        if (error) return res.error(errors.internal.DB_FAILURE, error, callback);
        if (results.length != 1) return res.error(errors.auth.INVALID_EMAIL, error, callback);
        var user = results[0];
        utils.comparePasswords(req.body.password, user.password, function(error, success) {
          if (!success) return res.error(errors.auth.INVALID_PASSWORD, error, callback);
          req.session = {};
          req.session.user = {id: user.id, email: user.email}
          return res.redirect(req.query.next || '/');
        });
      });
    }
  , render: function(callback) {
      res.render('auth', function(error, html) {
        if (error) return res.error(errors.internal.UNKNOWN, error);
        res.render('index', {content: html}, function(errror, html) {
          if (error) return res.error(errors.internal.UNKNOWN, error);
          res.send(html);
        });
      });
    }
  }

  async.series(tasks);
}

module.exports.logout = function(req, res) {
  req.session = null;
  return res.redirect(req.query.next || '/');
}