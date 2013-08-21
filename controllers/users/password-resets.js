var db = require('../../db');
var queries = require('../../db/queries');
var errors = require('../../errors');
var utils = require('../../utils');
var config = require('../../config');

module.exports.create = function(req, res, next) {
  var sql = db.builder.sql(queries.passwordReset.create(req.body.email));

  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (rows.length === 0) return res.error(errors.internal.DB_FAILURE, 'failed to create password reset');
    res.render('password-reset-email', {layout: false, token: rows[0].token, config: config}, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      utils.sendMail(rows[0].email, 'support@goodybag.com', 'Goodybag Cater password reset', html, function(err) {
        if (err) return res.error(errors.internal.UNKNOWN, err);
        res.send(201);
      });
    });
  });
}

module.exports.get = function(req, res, next) {
  var sql = db.builder.sql(queries.passwordReset.get(req.params.token));

  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    var context = rows.length > 0 ? {email: rows[0].email, token: req.params.token} : {badToken: true};
    res.render('reset-password', context, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      res.send(html);
    });
  });
}

module.exports.redeem = function(req, res, next) {
  var flow = [
    function(callback) {
      utils.encryptPassword(req.body.password, function(err, hash, salt) {
        if (err) res.error(errors.internal.UNKNOWN, err);
        return callback(err, hash);
      });
    },

    function(hash, callback) {
      var query = queries.user.update({password: hash}, {
        id: '$password_resets.user_id$',
        'password_resets.token': req.params.token
      });

      query.from = ['password_resets'];

      var sql = db.builder.sql(query);

      // TODO: transaction
      db.query(sql.query, sql.values, function(err, rows, result) {
        if (err) return res.error(errors.internal.DB_FAILURE, err);
        callback(err);
      });
    },

    function(callback) {
      var sql = db.builder.sql(queries.passwordReset.redeem(req.params.token));
      db.query(sql.query, sql.values, function(err, rows, result) {
        if (err) return res.error(errors.internal.DB_FAILURE, err);
        res.send(200);
      });
    }
  ];

  utils.async.waterfall(flow);
}
