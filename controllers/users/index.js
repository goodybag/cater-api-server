var db = require('../../db');
var queries = require('../../db/queries');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');

module.exports.cards = require('./cards');
module.exports.rewards = require('./rewards');

module.exports.list = function(req, res) {
  var tasks = {
    users:        db.users.find.bind( db.users, {}, { limit: 'all', order: 'id desc' } )
  , restaurants:  db.restaurants.find.bind( db.restaurants, {} )
  };

  utils.async.parallel(tasks, function(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('users', results);
  });
}

module.exports.get = function(req, res) {
  var query = queries.user.get(req.params.uid, req.query.columns);
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(error, rows, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!rows || !rows[0]) return res.status(404).render('404');
    res.render('user', {user: rows[0]}, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      return res.send(200, html);
    });
  });
}

module.exports.create = function(req, res) {
  var flow = {
    encrypt: function(callback) {
      utils.encryptPassword(req.body.password, function(error, hash, salt) {
        if (error) res.error(errors.internal.UNKNOWN, error);
        return callback(error, hash);
      });
    }
  , balanced: function(hash, callback) {
      utils.balanced.Customers.create({
        name: req.body.name
      }, function (error, customer) {
        if (error) return res.error(errors.internal.UNKNOWN, error), callback(error);
        callback(null, hash, customer.uri);
      });
    }
  , create: function(hash, balanced_customer_uri, callback) {
      var groups = req.body.groups || ['client'];
      var userData = utils.extend(req.body, {email: req.body.email.toLowerCase(), password: hash, balanced_customer_uri: balanced_customer_uri});
      var query = queries.user.create(utils.omit(userData, ['groups', 'restaurant_ids']));

      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results){
        if (error) {
          res.error(parseInt(error.code) === 23505 ? errors.registration.EMAIL_TAKEN : errors.internal.DB_FAILURE, error, callback);
          return callback(error);
        }
        var user = results[0];
        return callback(null, user, groups);
      });
    }
  , group: function(user, groups, callback) {
      groups = utils.map(groups, function(group) {
        return { user_id: user.id, group: group };
      });
      var query = queries.user.setGroup(groups);
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results){
        if (error) {
          res.error(errors.internal.DB_FAILURE, error);
          return callback(error);
        }
        callback(null, user, groups);
      });
    }
  , restaurant: function(user, groups, callback) {
      if (
           !utils.find(groups, {group: 'restaurant'})
        || !req.body.restaurant_ids
        || req.body.restaurant_ids.length <=0
        || isNaN(parseInt(req.body.restaurant_ids[0]))
      ) {
        callback(null);
        return res.send(204);
      }
      var query = queries.userRestaurant.create({
        user_id: user.id
      , restaurant_id: parseInt(req.body.restaurant_ids[0])
      });
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, function(error, results) {
        if (error) {
          res.error(errors.internal.DB_FAILURE, error);
          return callback(error);
        } else {
          callback(null);
          return res.send(204);
        }
      });
    }
  }

  utils.async.waterfall([flow.encrypt, flow.balanced, flow.create, flow.group, flow.restaurant]);
}

module.exports.update = function(req, res) {
  // TODO: require auth header with old password for password update
  if (!req.body.password) delete req.body.password; // Strip null passwords
  var update = function() {
    var query = queries.user.update(req.body, req.params.uid);
    var sql = db.builder.sql(query);
    db.query(sql.query, sql.values, function(err, rows, result) {
      if (err) return res.error(parseInt(err.code) === 23505 ? errors.registration.EMAIL_TAKEN : errors.internal.DB_FAILURE, err);

      if ( req.header('Content-Type').indexOf( 'application/json' ) >= 0 ){
        return res.send(204);
      }

      res.render('user', {user: rows[0], alert: true}, function(err, html) {
        if (err) return res.error(errors.internal.UNKNOWN, err);
        return res.send(200, html);
      });
    });
  }
  req.body.password == null ? update() : utils.encryptPassword(req.body.password, function(err, hash, salt) {
    if (err) return res.error(errors.internal.UNKNOWN, err);
    req.body.password = hash;
    update();
  });
}

// TODO: we don't really want to delete uses.  come up with some sort of deactivate user account thing.
module.exports.del = function(req, res) {
  var query = queries.user.del(parseInt(req.params.id));

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(error, results){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.noContent();
  });
}

module.exports.listOrders = function(req, res) {
  var filter = utils.contains(models.Order.statuses, req.query.filter) ? req.query.filter : 'all';
  models.Order.findByStatus({where: {user_id: req.params.uid}}, filter, function(err, orders) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.render('user-orders', {
      orders: utils.invoke(orders, 'toJSON')
    , hideUserDetails: true
    , filter: filter
    });
  });
}

module.exports.createSessionAs = function(req, res) {
  var query = queries.user.get(req.params.uid, req.query.columns);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (rows.length === 0) return res.send(404);
    var user = rows[0];
    req.session = utils.extend({oldUser: req.session.user}, req.session, {user: utils.pick(user, ['id', 'groups', 'email', 'created_at'])});
    res.redirect(req.query.next || '/restaurants');
  });
};

module.exports.returnSession = function(req, res) {

  // Restore original session and delete oldUser
  if (req.session.oldUser) {
    var session = utils.extend({}, req.session, {user: req.session.oldUser});
    req.session = utils.omit(session, 'oldUser');
  }
  res.redirect(req.query.next || '/restaurants');
};

module.exports.passwordResets = require('./password-resets');
module.exports.addresses = require('./addresses');
