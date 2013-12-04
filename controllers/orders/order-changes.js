var errors = require('../../errors');
var models = require('../../models');
var utils  = require('../../utils');


module.exports.list = function(req, res, next) {
  res.json(501, 'Not Implemented');
};

module.exports.get = function(req, res, next) {
  res.json(501, 'Not Implemented');
};

// NOTE: We will need to do much the same thing for order item create / update / delete.
// Once that is done, commonalities should be abstracted out, probably to the model.
module.exports.orderUpdate = function(order, req, res, next) {
  console.log('change');
  // like update, but create a pending change instead of applying it immedietly
  var isAdmin = req.session.user && utils.contains(req.session.user.groups, 'admin');
  models.Change.getChange(req.params.oid, isAdmin, function(err, change) {
    if (err)
      return utils.contains([404, 403], err) ? res.json(err, {}) : res.error(errors.internal.DB_FAILURE, err);

    var delta = utils.pick(req.body, updateableFields);
    var changeSummaries = utils.map(delta, function(val, key, obj) {
      return ['Change', key, 'from', order.attributes[key], 'to', val].join(' ');
    });

    var json = JSON.parse(change.attributes.order_json);
    utils.extend(json, delta);
    change.attributes.change_summaries = (change.attributes.change_summaries || []).concat(changeSummaries);
    change.attributes.order_json = JSON.stringify(json);

    change.save(function(err, rows, result) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      res.json(201, change.toJSON());  // TODO: is this best?
    });
  });
};

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
