define(function (require, exports, module) {
  var utils = require('utils');

  return utils.View.extend({
    events: function () {
      var ev = 'click ' + this.options.toggleSelector;
      var events = {};
      events[ev] = 'toggle';
      return events;
    },

    toggle: function (e) {
      e.preventDefault();
      var this_ = this;
      var options = {};
      options[this.options.field] = !this.options.model.get(this.options.field);
      this.options.model.save(options, {
        success: function (model, response, options) {
          if (this_.options.success && typeof this_.options.success === "function") {
            return this_.options.success.call(model, response, options);
          } else {
            return window.location.reload();
          }
        },

        error: function (model, response, options) {
          if (this_.options.error && typeof this_.options.error === "function") {
            return this_.options.error.call(model, response, options);
          } else {
            return alert('Could not toggle model!');
          }
        }
      });
    }
  });
});