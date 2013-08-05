var utils = require('../utils');
var db = require('../db');

// copied directly from backbone source
var extend = function(protoProps, staticProps) {
  var parent = this;
  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent's constructor.
  if (protoProps && utils.has(protoProps, 'constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ return parent.apply(this, arguments); };
  }

  // Add static properties to the constructor function, if supplied.
  utils.extend(child, parent, staticProps);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function.
  var Surrogate = function(){ this.constructor = child; };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate;

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) utils.extend(child.prototype, protoProps);

  // Set a convenience property in case the parent's prototype is needed
  // later.
  child.__super__ = parent.prototype;

  return child;
};

var Model = function(attrs, opts) {
  this.attributes = attrs || {};
}

utils.extend(Model.prototype, {
  attributes: {},
  validate: function() {
    //TODO validate against schema if present
  },
  toJSON: function() {
    return utils.clone(this.attributes);
  },
  save: function(callback) {
    var attrs = utils.omit(utils.pick(this.attributes, utils.keys(this.constructor.schema)), ['id', 'created_at']);
    query = {
      type: attrs.id ? 'update' : 'insert',
      table: this.constructor.table,
      values: attrs,
      returning: '*'
    };

    var sql = db.builder.sql(query);
    db.query(sql.query, sql.values, callback);
  }
});

Model.extend = function() {
  var child = extend.apply(this, arguments);
  if (child.table) {
    var defPath = String.prototype.replace.call('../db/definitions/' + child.table, '_', '-');
    try {
      child.schema = (require(defPath)||0).schema;
    } catch(e) {}
  }
  return child;
}

Model.defaultFindQuery = {
  columns: ['*'],
  limit: 100,
  offset: 0
}

Model.find = function(query, callback) {
  utils.defaults(query, this.defaultFindQuery, {table: this.table});
  query.type = 'select';

  var cols = utils.keys(this.schema);
  query.columns  = utils.intersection(query.columns, cols.concat('*'));
  if (query.where) query.where = utils.pick(query.where, cols);

  var sql = db.builder.sql(query);
  var self = this

  db.query(sql.query, sql.values, function(err, rows, result){
    if (err) return callback(err);
    callback(null, utils.map(rows, function(obj) { return new self(obj); }));
  });
};

Model.findOne = function(query, callback) {
  if (!utils.isObject(query)) query = {where: {id: query}};
  query.limit = 1;
  return this.find(query, function(err, models) {
    if (err) return callback(err);
    callback(null, models[0]);
  });
};

module.exports = Model;
