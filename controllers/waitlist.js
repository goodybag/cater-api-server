var db = require('../db');
var queries = require('../db/queries');
var errors = require('../errors');
var utils = require('../utils');

module.exports.add = function(req, res, next) {
  var done = function(email) {
    //TODO: send first email
    res.render('waitlist-confirm', {email: email}, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWON, err);
      res.send(201, html);
    });
  }

  var updateQuery = queries.waitlist.reAdd(req.body.email, req.body.organization);
  var updateSql = db.builder.sql(updateQuery);

  db.query(updateSql.query, updateSql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (rows.length !== 0) return done(rows[0].email);

    var insertQuery = queries.waitlist.create(req.body);
    var insertSql = db.builder.sql(insertQuery);

    //TODO: transaction.  not needed yet though.
    db.query(insertSql.query, insertSql.values, function(err, rows, result) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      done(rows[0].email);
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
