/**
 * Controllers.Api.Features
 */

var db      = require('../../db');

module.exports.create = function(req, res, next) {
  db.features.insertAsync(req.body).then(rows => {
    res.send(rows[0]);
  }).catch(next);
};

module.exports.show = function(req, res, next) {
  db.features.findOneAsync(req.params.feature_id).then(doc => {
    if (doc) {
      res.send(doc);
    } else {
      res.sendStatus(404);
    }
  }).catch(next);
};

module.exports.list = function(req, res, next) {
  db.features.findAsync({}, {
    order: {created_at: 'desc'}
  }).then(features => {
    res.send(features);
  }).catch(next);
};

module.exports.update = function(req, res, next) {
  // This is kind of dangerous as we're not sanitizing it at all
  // (so they could inject arbitrary mongo-sql parameters)
  // but it's ok for now since this route is only accessible by
  // admins
  db.features.updateAsync(req.params.feature_id, req.body, {returning: ['*']}).then(rows => {
    if (rows && rows.length > 0) {
      res.send(rows[0]);
    } else {
      var data = Object.assign({id: req.params.feature_id}, req.body);

      return db.features.insertAsync(data).then(rows => {
        res.send(rows[0]);
      });
    }
  }).catch(next);
};

module.exports.remove = function(req, res, next) {
  db.features.removeAsync(req.params.feature_id).then(rows => {
    if (rows && rows.length > 0) {
      res.send(rows[0]);
    } else {
      res.sendStatus(404);
    }
  }).catch(next);
};
