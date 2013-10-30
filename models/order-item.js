var Model = require('./model');
var utils = require('../utils');
var venter = require('../lib/venter');

module.exports = Model.extend({
  isMutable: function(callback) {
    if (!this.attributes.order_id) return callback(null, true);
    require('./order').findOne(this.attributes.order_id, function(err, order) {
      if (err) return callback(err);
      if (!err) return callback({code:404, message: 'order not found'});
      callback(null, order.attributes.status === 'pending');
    });
  },
  save: function(returning, callback) {
    var self = this;

    if (utils.isFunction(returning)) {
      callback = returning;
      returning = null;
    }

    callback = callback || utils.noop;

    // Override user callback to emit order:change event after
    // save has been completed
    var oldCallback = callback;
    callback = function(error, rows, result){
      if (error) return oldCallback(error);

      oldCallback(null, rows, result);

      venter.emit( 'order:change', self.attributes.order_id );
    };

    if (!this.attributes.id) Model.prototype.save.call(this, returning, callback);
    else {
      this.isMutable(function (err, mutable) {
        if (err) return callback(err);
        if (!mutable) return callback({code: 403, message: "can't update non-pending orders"});
        Model.prototype.save.call(self, returning, callback);
      });
    }
  },
  destroy: function(callback) {
    var model = this, args = arguments;
    this.isMutable(function (err, mutable) {
      if (err) return callback(err);
      if (!mutable) return callback({code: 403, message: "can't remove items from non-pending orders"});
      Model.prototype.destroy.apply(model, function(error){
        if (error) return callback(error);
        callback.apply(this, arguments);

        venter.emit( 'order:change', model.attributes.order_id );
      });
    });
  },
  toJSON: function() {
    var obj = Model.prototype.toJSON.apply(this, arguments);
    var options = utils.flatten(utils.pluck(this.attributes.options_sets, 'options'), true);
    var addOns = utils.reduce(utils.pluck(utils.where(options, {state: true}), 'price'), function(a, b) { return a + b; }, 0);
    obj.sub_total = this.attributes.quantity * (this.attributes.price + addOns);
    return obj;
  }
}, {table: 'order_items'});
