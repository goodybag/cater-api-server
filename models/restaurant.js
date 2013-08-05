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
      if (!self.categories || self.categories.length === 0)
        return callback(null, null);
      var categories = utils.map(self.categories, function(cat) { return cat.toJSON().id; });
      require('./item').find(
        {where: {'category_id': {$in: categories}}},
        function(err, results) {
          if (err) return callback(err);
          self.items = results;

          var catIndex = utils.object(utils.map(self.categories, function(cat) {
            return cat.attributes.id;
          }), self.categories);

          utils.each(results, function(item) {
            var cat = catIndex[item.attributes.category_id];
            cat.items ? cat.items.push(item) : cat.items = [item];
          });

          callback(null, results);
        }
      );
    }

    self.categories ? items() : self.getCategories(items);
  }
}, {table: 'restaurants'});