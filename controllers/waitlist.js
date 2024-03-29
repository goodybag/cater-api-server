var uuid = require('node-uuid')
var db = require('../db');
var queries = require('../db/queries');
var errors = require('../errors');
var utils = require('../utils');
var config = require('../config');

module.exports.add = function(req, res, next) {
  var done = function(email, token) {
    var context = {
      layout: 'email-layout',
      email: email,
      token: token,
      baseUrl: config.baseUrl
    };

    res.render('waitlist-initial-email', context, function(err, html) {
      // TODO: error handling
      utils.sendMail(email, 'waitlist@goodybag.com', 'Verify your email with Goodybag', html);
    });

    res.render('waitlist-add', {email: email}, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWON, err);
      res.send(201, html);
    });
  }

  var updateQuery = queries.waitlist.reAdd(req.body.email, req.body, uuid.v4());
  var updateSql = db.builder.sql(updateQuery);

  db.query(updateSql.query, updateSql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (rows.length !== 0) return done(rows[0].email, updateQuery.updates.token);

    var insertQuery = queries.waitlist.create(req.body);
    var insertSql = db.builder.sql(insertQuery);

    //TODO: transaction.  not needed yet though.
    db.query(insertSql.query, insertSql.values, function(err, rows, result) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      done(rows[0].email, rows[0].token);
    });
  });
}

module.exports.confirm = function(req, res, next) {
  var query = queries.waitlist.confirm(req.query.token);
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    var context = rows.length > 0 ? {email: rows[0].email} : {badToken: true};
    res.render('waitlist-confirm', context, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWON, err);
      res.send(html);
    });
  });
}

module.exports.remove = function(req, res, next) {
  var query = queries.waitlist.unsubscribe(req.query.token);
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    var context = rows.length > 0 ? {email: rows[0].email} : {badToken: true};
    res.render('waitlist-unsubscribe', context, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWON, err);
      res.send(html);
    });
  });
}
