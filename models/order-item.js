var Model = require('./model');
var utils = require('../utils');
var venter = require('../lib/venter');
var logger = require('../lib/logger').create('Model-OrderItem');

module.exports = Model.extend({
  save: function(returning, callback) {
    logger.info('Saving');
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

    if ( this.validate && typeof this.validate === 'function' ) this.validate();
    Model.prototype.save.call(self, returning, callback);
  },

  validate: function(attributes, options) {
    logger.info('Validating', { attributes: this.attributes, options: this.options });
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
}, {table: 'order_items'});
