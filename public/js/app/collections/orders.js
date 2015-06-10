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
      , 'plan_id': function(a, b) {
          var aPlanId = a.restaurant.get('plan_id');
          var bPlanId = b.restaurant.get('plan_id');
          return aPlanId === bPlanId ? 0 : aPlanId ? 1 : -1;
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
      , 'location': function(a, b) {
          var aLoc = a.get('location');
          var bLoc = b.get('location');
          if ( !aLoc ) return -1;
          if ( !bLoc ) return 1;
          return aLoc.name.localeCompare(bLoc.name);
        }
      , 'region': function(a, b) {
          var aReg = a.restaurant.get('region').name;
          var bReg = b.restaurant.get('region').name;
          return aReg.localeCompare(bReg);
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
