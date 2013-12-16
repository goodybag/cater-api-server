define(function(require, exports, module) {
  var utils = require('utils');
  var $ = require('jquery');
  var FormView = require('./form-view');
  var User = require('../models/user');

  return module.exports = FormView.extend({
    submitSelector: '.create-user-form .create-user-submit',

    events: {
      'submit .create-user-form': 'onSave',
      'keyup .create-user-form': 'onChange',
      'click .create-user-form': 'onChange'
    },

    initialize: function(options) {
      var this_ = this;
      this.model = this.model || new User();

      this.$submit = this.$el.find(this.submitSelector).button();

      this.listenTo(this.model, 'sync', function(model, options) {
        this.$submit.removeClass('hide');
        this.$submit.button('success');
        if (this_.options.reloadOnSuccess) window.location.reload();
        setTimeout(function() { this_.$submit.button('reset'); }, 3000);
        this.model.clear();
      });

      this.listenTo(this.model, 'error', function(model, options) {
        this.$submit.data('error-text', options.responseJSON.error.message);
        this.$submit.button('error');
        setTimeout(function() { this_.$submit.button('reset'); }, 3000);
      });
    },

    fieldGetters: {
      groups: function () {
        return utils.pluck(this.$el.find(this.fieldMap.groups), 'value');
      }
    },

    fieldMap: {
      email: '.create-user-form .create-user-email'
    , password: '.create-user-form .create-user-password'
    , name: '.create-user-form .create-user-name'
    , organization: '.create-user-form .create-user-organization'
    , groups: '.create-user-form .create-user-group:checked'
    }
  });
});