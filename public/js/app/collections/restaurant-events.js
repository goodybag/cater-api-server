if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var RestaurantEvent = require('../models/restaurant-event');

  return module.exports = Backbone.Collection.extend({
    model: RestaurantEvent,
    comparator: 'id',

    toFullCalendarEvents: function() {
      return this.invoke('toFullCalendarEvent');
    }
  });
});
