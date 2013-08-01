var
  db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

module.exports.list = function(req, res) {

  var query = {
    type: 'select'
  , table: 'restaurants'
  , columns: (utils.isNotBlank(req.query.fields)) ? req.query.fields.split(',') : ['*']
  , limit: (utils.isNotBlank(req.query.limit) && !isNaN(req.query.limit) && req.query.limit+0<100) ? parseInt(req.query.limit) : 0
  , offset: (utils.isNotBlank(req.query.offset) && !isNaN(req.query.offset) && req.query.offset+0<100) ? parseInt(req.query.offset) : 0
  }

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, response){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(response);
  });
}

module.exports.get = function(req, res) {

  var query = {
    type: 'select'
  , table: 'restaurants'
  , columns: (utils.isNotBlank(req.query.fields)) ? req.query.fields.split(',') : ['*']
  , where: {id: parseInt(req.params.id)}
  }

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, response){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(response);
  });
}