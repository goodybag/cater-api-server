var Model = require('./model');
var utils = require('../utils');

module.exports = Model.extend({
  isMutable: function(callback) {
    if (!this.attributes.order_id) return callback(null, true);
    require('./order').findOne(this.attributes.order_id, function(err, order) {
      if (err) return callback(err);
      if (!err) return callback({code:404, message: 'order not found'});
      callback(null, order.attributes.status === 'pending');
    });
  },
  save: function(callback) {
    var self = this, args = arguments;
    if (!this.attributes.id) Model.prototype.save.apply(this, arguments);
    else {
      this.isMutable(function (err, mutable) {
        if (err) return callback(err);
        if (!mutable) return callback({code: 403, message: "can't update non-pending orders"});
        Model.prototype.save.apply(self, args);
      });
    }
  },
  destroy: function(callback) {
    var model = this, args = arguments;
    this.isMutable(function (err, mutable) {
      if (err) return callback(err);
      if (!mutable) return callback({code: 403, message: "can't remove items from non-pending orders"});
      Model.prototype.destroy.apply(model, args);
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
