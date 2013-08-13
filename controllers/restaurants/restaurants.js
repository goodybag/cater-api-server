var
  db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  models.Restaurant.find(req.query, function(error, models) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('restaurants', {restaurants: utils.invoke(models, 'toJSON')}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      return res.send(html);
    });
  });
}

module.exports.get = function(req, res) {
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
      , where: {id: parseInt(req.params.rid)}
      }

      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results) {
        if (error) return callback(error);
        data.restaurant = results[0];
        return callback();
      });
    }
  , getCategories: function(callback) {
      var query = {
        type: 'select'
      , table: 'categories'
      , columns: ['*']
      , where: {restaurant_id: parseInt(req.params.rid)}
      , order: {order: 'asc'}
      }
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results) {
        if (error) return callback(error);
        data.categories = results;
        return callback();
      });
    }
  , getItems: function(callback) {
      // SELECT items.* FROM categories LEFT JOIN items on items.category_id=categories.id WHERE categories.restaurant_id=1;
      var query = {
        type: 'select'
      , table: 'categories'
      , columns: ['items.*']
      , leftJoin: {
          items: {'items.category_id': '$categories.id$'}
        }
      , where: {'categories.restaurant_id': parseInt(req.params.rid)}
      , order: {'categories.order':'asc', 'items.order': 'asc'}
      }
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results) {
        if (error) return callback(error);
        data.items = results;
        return callback();
      });
    }
  }

  var done = function(error, results) {
    if(error) return res.error(errors.internal.DB_FAILURE, error);
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
      var category = menu[categoryIdMenuIndex[item.category_id]];
      category.items.push(item);
    }
    res.render('menu', {restaurant: data.restaurant, menu: menu}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      return res.send(html);
    });
  }

  utils.async.parallel(tasks, done);
}

module.exports.listItems = function(req, res) {
  (new models.Restaurant({id: req.params.rid})).getItems(function(error, items) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(utils.invoke(items, 'toJSON'));
  });
}