/**
 * Restaurant Contacts View
 */

define(function(require, exports, module) {

  var utils = require('utils');
  var notify = require('notify');
  var FormView = require('../form-view');

  return module.exports = FormView.extend({
    events: {
      'click .btn-create-contact': 'create'
    , 'click .btn-update-contact': 'update'
    , 'click .btn-remove-contact': 'remove'
    },

    fieldMap: {
      name: '.event-name',
      description: '.event-description',
      during: '.event-during',
      closed: '.event-closed',
    },

    fieldGetters: {

    },

    initialize: function() {

    },

    create: function(e) {
      e.preventDefault();
    },

    update: function(e) {
      e.preventDefault();
    },

    remove: function(e) {
      console.log('hi');
      e.preventDefault();
    },
  });
});
