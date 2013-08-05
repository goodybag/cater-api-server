var Model = require('./model');
var utils = require('../utils');

module.exports = Model.extend({
  getItems: function(callback) {
    var self = this;
    callback = callback || function() {};
    require('./item').find(
      {where: {'category_id': self.attributes.id}},
      function(err, items) {
        if (err) return callback(err);
        self.items = items;
        callback(null, items);
      }
    );
  },

  toJSON: function() {
    var obj = Model.toJSON.apply(this, arguments);
    if (this.items) obj.items = utils.invoke(this.items, 'toJSON');
    return obj;
  }

}, {table: 'categories'});
