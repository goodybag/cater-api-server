var TipView = Backbone.View.extend({
  events: {
    'change .tip-percent': 'selectTip',
    'keydown .order-tip': 'cacheTip',
    'keyup .order-tip': 'customTip'
  },

  initialize: function() {
    this.tip = this.model.get('tip');
  },

  selectTip: function(e) {
    var val = parseInt(e.currentTarget.value);
    if (!_.isNaN(val)) {
      var tip = this.model.get('sub_total') * (val / 100);
      // this.model.set({
      //   'tip_percent': val
      // , 'tip': tip}
      // );
      this.options.orderView.onPriceChange();
      this.$el.find('.order-tip').val(Handlebars.helpers.dollars(tip));
    }
  },

  cacheTip: function(e) {
    this.tip = e.currentTarget.value;
  },

  customTip: function(e) {
    if (this.tip !== e.currentTarget.value)
      this.$el.find('.tip-percent option[value="custom"]').attr('selected', 'selected');
  }
});
