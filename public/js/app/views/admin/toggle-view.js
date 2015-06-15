define(function (require, exports, module) {
  var utils = require('utils');

  return utils.View.extend({
    events: {
        'click': 'toggle'
      }

    , onSuccess: function(model, response, options) {
        return window.location.reload();
      }

    , onError: function(model, response, options) {
        return alert('Could not toggle model!');
      }

    , toggle: function (e) {
        e.preventDefault();
        var options = {};
        options[this.options.field] = !this.options.model.get(this.options.field);
        this.options.model.save(options, {
          patch: true
        , success: this.onSuccess.bind(this)
        , error: this.onError.bind(this)
        });
      }
  });
});
