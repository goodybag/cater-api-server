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
  if (this.initialize) this.initialize(attrs, opts);
  return this;
}

utils.extend(Model.prototype, {
  attributes: {},
  validate: function() {
    //TODO validate against schema if present
  },
  toJSON: function() {
    return utils.clone(this.attributes);
  },
  save: function(query, callback, client) {
    if (utils.isFunction(query)) {
      client = callback;
      callback = query;
      query = {};
    }
    var attrs = utils.omit(utils.pick(this.attributes, utils.keys(this.constructor.schema)), ['id', 'created_at']);
    var id = this.attributes.id;
    var defaults = {
      type: id ? 'update' : 'insert',
      table: this.constructor.table,
      returning: ['*'],
      values: attrs
    };

    if (id) defaults.where = utils.extend({id: id}, query.where);

    var sql = db.builder.sql(utils.defaults(query || {}, defaults));
    var self = this;
    (client || db).query(sql.query, sql.values, function(err, rows, result) {
      if (client) {
        result = rows;
        rows = (result||0).rows || [];
      }
      if (!err && rows && rows[0]) utils.extend(self.attributes, rows[0]);
      callback.apply(this, arguments);
    })
  },
  destroy: function(callback, client) {
    if (!this.attributes.id) return callback('need an id');
    var query = {
      type: 'delete',
      table: this.constructor.table,
      where: {id: this.attributes.id}
    }
    var sql = db.builder.sql(query);
    (client || db).query(sql.query, sql.values, callback);
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

Model.find = function(query, callback, client) {
  utils.defaults(query, this.defaultFindQuery, {table: this.table});
  query.type = 'select';

  // var cols = utils.keys(this.schema);
  // query.columns  = utils.intersection(query.columns, cols.concat('*'));
  // if (query.where) query.where = utils.pick(query.where, cols);

  var sql = db.builder.sql(query);
  var self = this;
console.log(query, sql.query, sql.values);
  (client || db).query(sql.query, sql.values, function(err, rows, result){
    if (err) return callback(err);
    if (client) {
      result = rows;
      rows = (result||0).rows || [];
    }
    callback(null, utils.map(rows, function(obj) { return new self(obj); }));
  });
};

Model.findOne = function(query, callback, client) {
  if (!utils.isObject(query)) query = {where: {id: query}};
  query.limit = 1;
  return this.find(query, function(err, models) {
    if (err) return callback(err);
    callback(null, models[0]);
  }, client);
};

Model.defaultUpdateQuery = {
  returning: ['*']
};

Model.update = function(query, callback, client) {
  utils.defaults(query, this.defaultUpdateQuery);
  query.table = this.table;
  query.type = 'update';

  var sql = db.builder.sql(query);
  var self = this;

  (client || db).query(sql.query, sql.values, function(err, rows, result) {
    if (err) return callback(err);
    if (client) {
      result = rows;
      rows = (result||0).rows || [];
    }
    callback(null, utils.map(rows, function(obj) { return new self(obj); }));
  });
};

// TODO: abstract commonalities of update and create
Model.create = function(query, callback, client) {
  var constants = {
    type: 'insert',
    table: this.table
  };

  var defaults = { returning: ['*'] };

  var sql = db.builder.sql(utils.defaults(utils.extend({}, query, constants), defaults));
  var self = this;

  (client || db).query(sql.query, sql.values, function(err, rows, result) {
    if (err) return callback(err);
    if (client) {
      result = rows;
      rows = (result||0).rows || [];
    }
    callback(null, utils.map(rows, function(obj) { return new self(obj); }));
  });
};

module.exports = Model;
