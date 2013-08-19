var db = require('../db');
var queries = require('../db/queries');
var errors = require('../errors');
var utils = require('../utils');

module.exports.add = function(req, res, next) {
  var query = queries.waitlist.create(req.body);
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    //TODO: send first email
    res.render('waitlist-confirm', {email: req.body.email}, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWON, err);
      res.send(201, html);
    });
  });
}

module.exports.remove = function(req, res, next) {
  var query = queries.waitlist.unsubscribe(req.query.token);
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(err, rows, result) {
    // TODO: bad token error
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(200); // TODO: render unsubscribe confirmed page
  });
}
