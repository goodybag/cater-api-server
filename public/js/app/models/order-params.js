define(function(require, exports, module) {
  var utils = require('utils');

  return module.exports = utils.Model.extend({
    url: '/session/order-params',

    transforms: {
      date: function( val ){
        if ( val ) return utils.dateTimeFormatter( val );
        return val;
      }
    },

    initialize: function() {
      var this_ = this;
      this.on('change:order_type', function(val) {
        if (val === 'pickup') {
          this_.set('sort', 'distance');
        } else if (val === 'delivery' && this_.get('sort') === 'distance') {
          this_.set('sort', 'name');
        }
      });
    },

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