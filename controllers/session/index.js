var
  db = require('../../db')
, queries = require('../../db/queries')
, errors = require('../../errors')
, utils = require('../../utils')
;

module.exports.get = function(req, res) {
  res.json(200, req.session);
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
      res.redirect(req.query.next || '/restaurants');
      return callback();
    }
  }

  utils.async.series(tasks);
}

module.exports.del = function(req, res) {
  req.session = null;
  return res.redirect(req.query.next || '/restaurants');
}

module.exports.patch = function(req, res) {
  return res.redirect(req.query.next || '/restaurants');
}

module.exports.getOrderParams = function(req, res) {
  res.send(req.session.orderParams);
};

module.exports.updateOrderParams = function(req, res) {
  req.session.orderParams = {
    zip: parseInt(req.body.zip, 10)
  , date: req.body.date
  , time: req.body.time
  , guests: parseInt(req.body.guests, 10)
  }
  console.log(req.session.orderParams);
  res.send(req.session.orderParams);
};