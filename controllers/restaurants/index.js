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