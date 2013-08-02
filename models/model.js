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
}

Model.extend = extend;

Model.defaultFindQuery = {
  type: 'select',
  columns: ['*'],
  limit: 100,
  offset: 0
}

Model.find = function(query, callback) {
  utils.defaults(query, this.defaultFindQuery, {table: this.table});

  var cols = utils.keys(this.schema);
  query.columns  = utils.intersection(query.columns, cols.concat('*'));
  if (query.where) query.where = utils.pick(query.where, cols);

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, callback);
};

Model.findOne = function(query, callback) {
  if (!utils.isObject(query)) query = {where: {id: query}};
  query.limit = 1;
  return this.find(query, callback);
};

module.exports = Model;
