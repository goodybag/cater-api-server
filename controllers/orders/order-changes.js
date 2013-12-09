var errors = require('../../errors');
var models = require('../../models');
var utils  = require('../../utils');


module.exports.list = function(req, res, next) {
  models.Change.find({order_id: req.params.oid}, function(err, changes) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    return res.json(200, utils.invoke(changes, 'toJSON'));
    // TODO: html
  });
};

module.exports.get = function(req, res, next) {
  models.Change.findOne(req.params.cid, function(err, change) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!change) return res.render('404');
    return res.json(200, change.toJSON());
    // TODO: html
  });
};


// Decorator for creating / updating changes
// Takes a function which takes a change object and a request and modifies the change object appropriately
//
function changer(func) {
  return function(order, req, res, next) {
  var isAdmin = req.session.user && utils.contains(req.session.user.groups, 'admin');
  models.Change.getChange(order, isAdmin, function(err, change) {
    if (err)
      return utils.contains([404, 403], err) ? res.json(err, {}) : res.error(errors.internal.DB_FAILURE, err);

    func(change, req, function(err) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      change.save(function(err, rows, result) {
        if (err) return res.error(errors.internal.DB_FAILURE, err);
        res.json(201, change.toJSON());  // TODO: is this best?
      });
    });
  };
};

module.exports.orderUpdate = changer(function(change, req, done) {
  // like update, but create a pending change instead of applying it immedietly
  var delta = utils.pick(req.body, models.Order.updateableFields);
  var changeSummaries = utils.map(delta, function(val, key, obj) {
    return ['Change', key, 'from', order.attributes[key], 'to', val].join(' ');
  });

  utils.extend(change.attributes.order_json, delta);
  change.attributes.change_summaries = (change.attributes.change_summaries || []).concat(changeSummaries);
  done();
});

module.exports.addItem = changer(function(change, req, done) {
  done();
});

module.exports.removeItem = changer(function(change, req, done) {
  done();
});

module.exports.updateItem = changer(function(change, req, done) {
  done();
});

module.exports.update = function(req, res, next) {
  var adminUpdates = utils.omit(req.body, ['status']);
  models.Change.findOne(req.params.cid, function(err, change) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!change) return res.json(404, 'Not Found');

    var isAdmin = req.session.user && utils.contains(req.session.user.groups, 'admin');
    // TODO: use async to enforce sequencing
    if (isAdmin)
      change.save(adminUpdates, function(err, rows, result) {});
    if (req.body.status)
      change.changeStatus(req.body.status, function(err) {});
    var done = function(err) {
      if (err)
        return typeof err === 'number' ? res.json(err, {}) : res.error(errors.internal.DB_FAILURE, err);
      return res.json(200, change.toJSON());
    };
    return res.json(200, change.toJSON());
  });
};

module.exports.cancel = function(req, res, next) {
  models.Change.findOne(req.params.cid, function(err, change) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!change) return res.json(404, 'Not Found');

    var isAdmin = req.session.user && utils.contains(req.session.user.groups, 'admin');
    change.changeStatus('canceled', isAdmin, function(err) {
      if (err)
        return typeof err === 'number' ? res.json(err, {}) : res.error(errors.internal.DB_FAILURE, err);
      return res.json(200, change.toJSON());
    });
  });
};
