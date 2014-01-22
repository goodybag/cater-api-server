define(function(require, exports, module) {
  var Backbone = require('backbone');
  var TipView = require('./tip-view');

  return module.exports = Backbone.View.extend({
    events: {
      'click .btn-default': 'addTip',
      'click .btn-cancel': 'cancel'
    },

    initialize: function () {
      this.tipView = new TipView({
        el: this.$el.find('.tip-area').get(0)
      , model: this.model
      , orderView: this.options.orderView
    });
      this.tipView.customTip();
    },

    addTip: function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      var self = this;
      var val = parseFloat(this.$el.find('.order-tip').val().trim()||'');
      var tip = !_.isNaN(val) ? Math.round(val * 100) : null;
      this.options.orderView.onPriceChange();
      this.model.save({'tip': tip}, {
        patch: true
      , validate: false
      , success: function(model, response, optons) {
          window.location.reload();
        }
      , error: function(model, xhr, options) {
          alert('Sorry, there was an error adding the tip!');
          console.log(arguments);
          self.$el.modal('hide');
        }
      });
    },

    cancel: function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      this.options.orderView.resetTip();
      this.tipView.customTip(e);
      this.$el.modal('hide');
    }
  });
});