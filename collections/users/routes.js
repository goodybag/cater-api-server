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
  db.query(sql.query, sql.values, function(error, response){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(response);
  });
}

module.exports.create = function(req, res) {
  console.log('0');
  console.log(req.body);

  var flow = {
    encrypt: function(callback) {
      utils.encryptPassword(req.body.password, function(error, encrypted, salt) {
        if (error) res.send(errors.internal.UNKNOWN, error);
        return callback(error, encrypted, salt);
      });
    }
  , create: function(encrypted, callback) {
      var query = {
        type: 'insert'
      , table: 'users'
      , values: {
          first_name: req.body.first_name 
        , last_name: req.body.last_name
        , email: req.body.email
        , password: encrypted
        , organization: req.body.organization
        }
      , returning: ['id']
      };

      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, response){
        if (error){ res.error(errors.internal.DB_FAILURE, error); return callback(error); }
        res.send(response); return callback();
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
  db.query(sql.query, sql.values, function(error, response){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(response);
  });
}

module.exports.del = function(req, res) {
  var query = {
    type: 'delete'
  , table: 'users'
  , where: {id: parseInt(req.params.id)}
  };

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, response){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.noContent();
  });
}