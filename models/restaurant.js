var Model = require('./model');
var utils = require('../utils');

module.exports = Model.extend({
  getCategories: function(callback) {
    var self = this;
    callback = callback || function() {};
    require('./category').find(
      {where: {'restaurant_id': this.attributes.id}},
      function(err, results) {
        if (err) return callback(err);
        self.categories = results;
        callback(null, results);
      });
  },

  getItems: function(callback) {
    var self = this;
    callback = callback || function() {};
    var items = function(err) {
      if (err) return callback(err);
      var categories = utils.map(self.categories, function(cat) { return cat.toJSON().id; });
      require('./item').find(
        {where: {'category_id': {$in: categories}}},
        function(err, results) {
          if (err) return callback(err);
          self.items = results;
          callback(null, results);
        }
      );
    }

    self.categories ? items() : self.getCategories(items);
  }
}, {table: 'restaurants'});