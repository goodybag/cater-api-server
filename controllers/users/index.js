var
  async = require('async')

, db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

module.exports.list = function(req, res) {
  var query = {
    type: 'select'
  , table: 'users'
  , columns: (utils.isNotBlank(req.query.fields)) ? req.query.fields.split(',') : ['*']
  , limit: (utils.isNotBlank(req.query.limit) && !isNaN(req.query.limit) && req.query.limit+0<100) ? parseInt(req.query.limit) : 100
  , offset: (utils.isNotBlank(req.query.offset) && !isNaN(req.query.offset) && req.query.offset+0<100) ? parseInt(req.query.offset) : 0
  };

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
      var query = {
        type: 'insert'
      , table: 'users'
      , values: {
          first_name: req.body.first_name 
        , last_name: req.body.last_name
        , email: req.body.email.toLowerCase()
        , password: hash
        , organization: req.body.organization
        }
      , returning: ['id', 'email']
      };

      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results){
        if (error) return res.error(parseInt(error.code) === 23505 ? errors.registration.EMAIL_TAKEN : errors.internal.DB_FAILURE, error, callback);
        var user = results[0];
        req.session = {};
        req.session.user = {id: user.id, email: user.email};
        return res.redirect(req.query.next || '/');
      });
    }
  }

  async.waterfall([flow.encrypt, flow.create]);
}

module.exports.get = function(req, res) {
  var query = {
    type: 'select'
  , table: 'users'
  , columns: (req.query.fields != null && req.query.field != '') ? req.query.fields.split(',') : ['*']
  , where: {id: parseInt(req.params.id)}
  };

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(results);
  });
}

module.exports.del = function(req, res) {
  var query = {
    type: 'delete'
  , table: 'users'
  , where: {id: parseInt(req.params.id)}
  };

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.noContent();
  });
}