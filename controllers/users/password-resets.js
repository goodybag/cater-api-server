var db = require('../../db');
var queries = require('../../db/queries');
var errors = require('../../errors');
var utils = require('../../utils');


module.exports.create = function(req, res, next) {
  var sql = db.builder.sql(queries.passwordReset.create(req.body.email));

  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(201);
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
        user_id: '$users.id$',
        token: req.params.token
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
      var sql = db.builder.sql(queryies.passwordReset.redeem(req.params.token));
      db.query(sql.query, sql.values, function(err, rows, result) {
        if (err) return res.error(errors.internal.DB_FAILURE, err);
        res.send(200);
      });
    }
  ];

  utils.async.waterfall(flow);
}
