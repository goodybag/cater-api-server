define(function (require, exports, module) {
  var utils = require('utils');
  var FormView = require('../form-view');

  return module.exports = FormView.extend({
    events: {
      'click .btn-continue': 'nextStep'
    }
  , initialize: function () {
      console.log('init');
      this.step = 1;
    }
  , getStep: function (step) {
      return this.$el.find(
        '.form-step[data-step=":step"]'.replace(':step', step)
      );
  }
  , nextStep: function (e) {
      if (e) {
        e.preventDefault();
      }

      if ( this.step >= this.options.steps ) {
        // submit form
        return;
      }

      this.nextView();

    }
  , nextView: function () {
      this.$current = this.getStep( this.step );
      this.$next = this.getStep( this.step + 1 );
      this.$steps = this.$el.find('.form-step');

      this.$steps.addClass('hide');
      this.$next.removeClass('hide')
      this.step++;

      if (this.step > this.options.steps - 1) {
        this.$el.find('.btn-continue').text('submit');
      }
      return this;
    }
  });
});
