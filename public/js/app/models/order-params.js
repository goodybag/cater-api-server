define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.Model.extend({
    url: '/session/order-params',
    isNew: function() { return false; },
    isComplete: function() {
      var fields;

      if (this.get('order_type') === 'delivery'){
        fields = ['zip', 'guests', 'date', 'time'];
      } else {
        fields = ['guests', 'date', 'time'];
      }

      return _.reduce(fields, function(memo, key) {
        return memo && this.get(key);
      }, true, this);
    },

    getDateTime: function(){
      return moment( this.get('date') + ' ' + this.get('time') )._d;
    }
  });
});