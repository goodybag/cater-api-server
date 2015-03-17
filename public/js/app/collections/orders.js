if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Order = require('../models/order');

  return module.exports = Backbone.Collection.extend({
    model: Order
  , comparator: 'id'
  , getFullCalendarEvents: function() {
      return this.invoke('getFullCalendarEvent');
    }
  , sortStrategies: function(param) {
      var strategies = {
        'id': 'id'
      , 'type': 'type'
      , 'organization': function(a, b) {
          var aOrg = a.get('user').organization;
          var bOrg = b.get('user').organization;
          return aOrg.localeCompare(bOrg);
        }
      , 'has_contract': function(a, b) {
          var aHasContract = a.restaurant.get('has_contract');
          var bHasContract = b.restaurant.get('has_contract');
          return aHasContract - bHasContract;
        }
      , 'restaurant': function(a, b) {
          return a.restaurant.get('name').localeCompare(b.restaurant.get('name'));
        }
      , 'user': function(a, b) {
          return a.get('user').email.localeCompare(b.get('user').email);
        }
      , 'datetime': function(a, b) {
          return new Date(a.get('datetime')) - new Date(b.get('datetime'));
        }
      };

      return strategies[param] || 'id';
    }
  , setComparator: function(param) {
      this.comparator = this.sortStrategies(param);
      this.sort();
    }
  });
});
