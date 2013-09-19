var Model = require('./model');

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
    obj.sub_total = this.attributes.price * this.attributes.quantity;
    return obj;
  }
}, {
  table: 'order_items',
  find: function(query, callback) {
    query.with = utils.extend({
      // TODO: array syntax for ordering
      options_agg: {
        type: 'select',
        table: 'order_options',
        columns: [
          'order_options_set_id',
          {
            type: 'array_agg',
            as: 'options',
            expression: '(\'{"name":"\' || name || \'", "price":\' || CASE WHEN price IS NULL THEN \'null\' ELSE price::text END || \', "state":\' || state || \'}\')::json'
          }
        ],
        groupBy: 'order_options_set_id'
      },

      options_sets_agg: {
        type: 'select',
        table: 'order_options_sets',
        joins: {
          options_agg: {
            type: 'left',
            on: { 'order_options_set_id': '$order_options_sets.id$' }
          }
        },
        columns: [
          'order_item_id',
          {
            type: 'array_agg',
            as: 'options',
            expression: '(\'{"name": \' || CASE WHEN name IS NULL THEN \'null\' ELSE \'"\' || name || \'"\' END  || \', "type": "\' || type || \'", "options": \' || array_to_json(options) || \'}\')::json'
          }
        ],
        groupBy: 'order_item_id'
      }
    }, query.with);

    query.columns = query.columns && query.columns.length ? query.columns : ['*'];

    query.joins = utils.extend({
      options_sets_agg: {
        type: 'left',
        on: { 'order_item_id': '$order_items.id$' }
      }
    }, query.joins);

    query.columns.push({
      type: 'array_to_json',
      as: 'options_sets',
      expression: 'options_sets_agg.options'
    });

    return Model.find.call(this, query, callback);
  }
});
