var db = require('../../db');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');

var sprintf = require("sprintf-js").sprintf;
var vsprintf = require("sprintf-js").vsprintf;

var Transaction = require('pg-transaction');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  var query = utils.extend({where: {}}, req.query);
  utils.extend(query.where, {'restaurant_id': req.params.rid});
  models.Order.find(query, function(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(utils.invoke(results, 'toJSON'));
  });
}

module.exports.create = function(req, res) {
  var order = new models.Order(utils.extend({}, req.body, {user_id: req.session.user.id}));
  order.save(function(err) {
    if (err) return res.error(errors.internal.DB_FAILURE, error);
    res.send(201, order.toJSON());
  });
}

module.exports.current = {};

module.exports.current.listItems = function(req, res) {
  // SELECT order_items.* FROM orders LEFT JOIN order_items ON orders.id=order_items.order_id WHERE orders.status='pending' AND orders.restaurant_id=1;
  var query = {
    type: 'select'
  , table: 'orders'
  , columns: ['order_items.*']
  , leftJoin: {order_items: {'orders.id': '$order_items.order_id$'}}
  , where: {'orders.id': parseInt(req.params.rid), 'orders.status': 'pending'}
  }

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.json(results);
  });
}

module.exports.current.addItem = function(req, res) {
  // mongo-sql can't most of the queries in here yet, so just using vsprintf instead to be consistent in this route

  db.getClient(function(error, client, done) {
    var tx = new Transaction(client);

    var item = null;
    utils.async.series([

        // get item
        function(callback) {
          var text = "SELECT id, name, description, price, feeds_min, feeds_max FROM items WHERE id=%d";
          var values = [
            parseInt(req.body.item_id)
          ];

          db.query(vsprintf(text, values), function(error, results){
            if (error) return callback(error);

            if (results.length == 1) item = results[0];
            if (!item) return callback(errors.SOMETHING_HERE);
            return callback(null, results);
          });
        }

        // begin transaction
      , function(callback) {
          tx.begin(callback);
        }

        // create order if it doesn't exist
      , function(callback) {
          var text = [
            "INSERT INTO orders (user_id, restaurant_id)"
          , "SELECT %d, %d WHERE NOT EXISTS"
          , "(SELECT id FROM orders"
          , "WHERE restaurant_id = %d AND user_id = %d AND status='pending')"
          ].join(' ');

          var values = [
            req.session.user.id
          , parseInt(req.params.rid)
          , parseInt(req.params.rid)
          , req.session.user.id
          ];

          tx.query(vsprintf(text, values), callback);
        }

        // remove item from order_items if it already exists, so we can replace the item w/new information
        // (quantity in particular is what we want to replace, but other things as well just in case they changed)
      , function(callback) {
          var text = "DELETE FROM order_items WHERE item_id=%d";
          var values = [parseInt(req.body.item_id)];
          tx.query(vsprintf(text, values), callback);
        }

        // add item to order
      , function(callback) {
          var text = [
            "INSERT INTO order_items (order_id, item_id, quantity, name, description, price, feeds_min, feeds_max)"
          , "SELECT orders.id, %d, %d, '%s', '%s', %d, %d, %d FROM orders"
          , "WHERE orders.user_id=%d AND orders.restaurant_id=%d AND orders.status='pending'"
          , "RETURNING *;"
          ].join(' ');

          var values = [
            parseInt(req.body.item_id)
          , parseInt(req.body.quantity)
          , item.name
          , item.description
          , item.price
          , item.feeds_min
          , item.feeds_max
          , req.session.user.id
          , parseInt(req.params.rid)
          ];

          tx.query(vsprintf(text, values), callback);
        }
      ]

      // finish up (commit/rollback)
    , function(error, results) {
        if(error) {
          tx.rollback(function(error) {
            done();
            if (error) return res.error(errors.internal.DB_FAILURE, error);
          });
        }
        tx.commit(function(error) {
          done();
          if (error) return res.error(errors.internal.DB_FAILURE, error);
          res.json(results[4].rows[0]);
        });
      }
    );
  });
}

module.exports.current.updateItem = function (req, res) {
  if (parseInt(req.body.quantity) <=0) return module.exports.current.removeItem(req,res);
  var query = {
    type: 'update'
  , table: 'order_items'
  , where: {id: parseInt(req.params.iid)}
  , updates: {
      quantity: parseInt(req.body.quantity)
    }
  }
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(204);
  });
}

module.exports.current.removeItem = function (req, res) {
  var query = {
    type: 'delete'
  , table: 'order_items'
  , where: {id: parseInt(req.params.iid)}
  }
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(204);
  });
}