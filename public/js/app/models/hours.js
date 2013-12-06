define(function(require, exports, module) {
  var Backbone = require('backbone');

  module.exports = Backbone.Model.extend({
    allDay: function() {
      return _.isEqual(this.get('times'), [['00:00:00', '23:59:59']]);
    },

    closed: function() {
      return this.get('times').length === 0;
    },

    toJSON: function() {
      return this.get('times');
    }
  });
});