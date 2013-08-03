var
  async = require('async')
, db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

module.exports.list = function(req, res) {

  var query = {
    type: 'select'
  , table: 'restaurants'
  , columns: (utils.isNotBlank(req.query.fields)) ? req.query.fields.split(',') : ['*']
  , limit: (utils.isNotBlank(req.query.limit) && !isNaN(req.query.limit) && req.query.limit+0<100) ? parseInt(req.query.limit) : 100
  , offset: (utils.isNotBlank(req.query.offset) && !isNaN(req.query.offset) && req.query.offset+0<100) ? parseInt(req.query.offset) : 0
  }

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, response){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('businesses', {businesses: response}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      res.render('index', {content: html}, function(errror, html) {
        if (error) return res.error(errors.internal.UNKNOWN, error);
        res.send(html);
      });
    });
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

module.exports.menu = function(req, res) {
  var data = {
    restaurant: null
  , categories: null
  , items: null
  };

  var tasks = {
    getRestaurant: function(callback) {
      var query = {
        type: 'select'
      , table: 'restaurants'
      , columns: ['*']
      , where: {id: parseInt(req.params.id)}
      }

      var sql = db.builder.sql(query);
      console.log(sql.query);
      db.query(sql.query, sql.values, function(error, results) {
        if (error) return res.error(errors.internal.DB_FAILURE, error, callback);
        data.restaurant = results[0];
        return callback();
      });
    }
  , getCategories: function(callback) {
      var query = {
        type: 'select'
      , table: 'menu_categories'
      , columns: ['*']
      , where: {restaurant_id: parseInt(req.params.id)}
      , order: {order: 'asc'}
      }
      var sql = db.builder.sql(query);
      console.log(sql.query);
      db.query(sql.query, sql.values, function(error, results) {
        if (error) return res.error(errors.internal.DB_FAILURE, error, callback);
        data.categories = results;
        return callback();
      });
    }
  , getItems: function(callback) {
      var query = {
        type: 'select'
      , table: 'menu_items'
      , columns: ['*']
      , where: {restaurant_id: parseInt(req.params.id)}
      , order: {order: 'asc'}
      }
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results) {
        if (error) return res.error(errors.internal.DB_FAILURE, error, callback);
        data.items = results;
        return callback();
      });
    }
  }

  var done = function(error, results) {
    if(error) return;
    var menu = [];
    var categoryIdMenuIndex = {};

    for(var i=0; i<data.categories.length; i++) {
      var category = data.categories[i];
      category.items = [];
      menu.push(category);
      categoryIdMenuIndex[category.id] = i;
    }

    for(var i=0; i<data.items.length; i ++) {
      var item = data.items[i];
      var category = menu[categoryIdMenuIndex[item.menu_category_id]];
      category.items.push(item);
    }
    console.log(menu);
    res.render('menu', {restaurant: data.restaurant, menu: menu}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      res.render('index', {content: html}, function(error, html) {
        if (error) return res.error(errors.internal.UNKNOWN, error);
        return res.send(html);
      })
    });
  }

  async.parallel(tasks, done);
}