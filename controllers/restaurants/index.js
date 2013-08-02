var
  async = require('async')
, db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  models.Restaurant.find(req.query, function(error, models) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('businesses', {businesses: utils.invoke(models, 'toJSON')}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      res.render('index', {content: html}, function(errror, html) {
        if (error) return res.error(errors.internal.UNKNOWN, error);
        res.send(html);
      });
    });
  });
}

module.exports.get = function(req, res) {
  models.Restaurant.findOne(parseInt(req.params.id), function(error, response) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(response ? response.toJSON() : 404);
  });
}

module.exports.menu = function(req, res) {
  var data = {
    categories: null
  , items: null
  };

  var tasks = {
    getCategories: function(callback) {
      var query = {
        type: 'select'
      , table: 'menu_categories'
      , columns: ['*']
      , where: {id: parseInt(req.params.id)}
      }
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, response) {
        if (error) return res.error(errors.internal.DB_FAILURE, error, callback);
        data.categories = response;
        return callback();
      });
    }
  , getItems: function(callback) {
      var query = {
        type: 'select'
      , table: 'menu_items'
      , columns: ['*']
      , where: {id: parseInt(req.params.id)}
      }
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, response) {
        if (error) return res.error(errors.internal.DB_FAILURE, error, callback);
        data.items = response;
        return callback();
      });
    }
  }

  var done = function(error, results){
    if(error) return;
    res.send(data);
  }

  async.parallel(tasks, done);
}