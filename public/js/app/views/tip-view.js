define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({
    events: {
      'change .tip-percent': 'selectTip',
      'keydown .order-tip': 'cacheTip',
      'keyup .order-tip': 'customTip'
    },

    initialize: function() {
      this.tip = this.model.get('tip');
      this.$el.find('.tip_percent').val(this.model.get('tip_percent') || 0);
    },

    selectTip: function(e) {
      var val = parseInt(e.currentTarget.value);
      if (!_.isNaN(val)) {
        var tip = this.model.get('sub_total') * (val / 100);
        this.$el.find('.order-tip').val(Handlebars.helpers.dollars(tip));
        this.options.orderView.onPriceChange();
      }
    },

    cacheTip: function(e) {
      this.tip = e.currentTarget.value;
    },

    customTip: function(e) {
      if (this.tip !== e.currentTarget.value) {
        this.$el.find('.tip-percent option[value="custom"]').attr('selected', 'selected');
        this.options.orderView.onPriceChange();
      }
    }
  });
});