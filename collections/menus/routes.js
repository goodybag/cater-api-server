var
  db          = require('../../db')
// , errors      = require('../../lib/error')
;

module.exports.list = function(req, res) {

  var query = {
    type: 'select'
  , table: 'restaurants'
  , columns: (req.query.fields != null && req.query.field != '') ? req.query.fields.split(',') : ['*']
  }

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, response){
    if (error) return res.error("OH NO!");
    res.send(response);
  });
}

module.exports.get = function(req, res) {

  var query = {
    type: 'select'
  , table: 'restaurants'
  , columns: (req.query.fields != null && req.query.field != '') ? req.query.fields.split(',') : ['*']
  , where: {id: parseInt(req.params.id)}
  }

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, response){
    if (error) return res.error("OH NO!");
    res.send(response);
  });
}