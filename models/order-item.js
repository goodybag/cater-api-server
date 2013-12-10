var Model = require('./model');
var Item = require('./item');
var utils = require('../utils');
var venter = require('../lib/venter');

module.exports = Model.extend({
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

    Model.prototype.save.call(self, returning, callback);
  },
  destroy: function(callback) {
    var model = this, args = arguments;
    Model.prototype.destroy.apply(model, function(error){
      if (error) return callback(error);
      callback.apply(this, arguments);

      venter.emit( 'order:change', model.attributes.order_id );
    });
  },
  toJSON: function() {
    var obj = Model.prototype.toJSON.apply(this, arguments);
    var options = utils.flatten(utils.pluck(this.attributes.options_sets, 'options'), true);
    var addOns = utils.reduce(utils.pluck(utils.where(options, {state: true}), 'price'), function(a, b) { return a + b; }, 0);
    obj.sub_total = this.attributes.quantity * (this.attributes.price + addOns);
    return obj;
  }
}, {
  table: 'order_items',

  sanitizeOptions: function(oldOpts, newOpts) {
    // get the current state, and only the current state, from each option, keyed by uuid.
    var states = utils.object(utils.map(utils.flatten(utils.pluck(newOpts, 'options'), true), function(option, index, arr) {
      return [option.id, !!option.state];
    }));

    // clone the old options, but with the new states
    return utils.map(oldOpts, function(set) {
      return utils.extend({}, set, {options: utils.map(set.options, function(option) {
        return utils.extend({state: !!states[option.id]}, utils.pick(option, ['id', 'name', 'price', 'description']));
      })});
    });
  },

  createFromItem: function(itemId, orderId, orderItemAttrs, callback) {
    var OrderItem = this;
    Item.findOne(itemId, function(err, item) {
      if (err) return callback(err);
      if (!item) return callback(404);
      var attrs = utils.extend(item.toJSON(), orderItemAttrs, {order_id: orderId});
      attrs.options_sets = OrderItem.sanitizeOptions(attrs.options_sets, orderItemAttrs.options_sets)

      var orderItem = new OrderItem(utils.omit(attrs, ['id', 'created_at']));
      callback(null, orderItem);
    });
  }
});
