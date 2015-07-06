/**
 * Restaurant Contacts View
 */

define(function(require, exports, module) {

  var utils = require('utils');
  var notify = require('notify');

  return module.exports = Backbone.View.extend({
    events: {
      'click .btn-create-contact': 'create'
    , 'click .btn-update-contact': 'update'
    , 'click .btn-remove-contact': 'remove'
    },

    getProps: function() {
      var name = this.$el.find('input[name="name"]').val();
      var notes = this.$el.find('textarea[name="notes"]').val();
      var sms_phones = this.parsePhoneList(this.$el.find('input[name="sms_phones"]').val());
      var voice_phones = this.parsePhoneList(this.$el.find('input[name="voice_phones"]').val());
      var emails = '{' + this.$el.find('input[name="emails"]').val() + '}';
      var notify = this.$el.find('input[name="notify"]').is(':checked');
      var disable_sms = this.$el.find('input[name="disable_sms"]').is(':checked');
      var receives_payment_summaries = this.$el.find('input[name="receives_payment_summaries"]').is(':checked');

      return {
        name: name
      , notes: notes
      , sms_phones: sms_phones
      , voice_phones: voice_phones
      , emails: emails
      , notify: notify
      , disable_sms: disable_sms
      , receives_payment_summaries: receives_payment_summaries
      };
    },

    // strip extraneous characters, format into postgres array string
    parsePhoneList: function(str) {
      if (!str) return '{}';
      var list = str
        .split(',')
        .map(function(num) {
          return num.replace(/[^\d]/g, '');
        })
        .join(',');

      return '{' + list + '}';
    },

    initialize: function() {
    },

    create: function(e) {
      e.preventDefault();
      $.ajax({
        type: 'post'
      , url: '/api/restaurants/' + this.options.restaurantId +'/contacts'
      , data : this.getProps()
      , success: function() {
          window.location.reload();
        }
      , error: function() {
          alert('Unable to create!');
        }
      });
    },

    update: function(e) {
      e.preventDefault();
      $.ajax({
        type: 'put'
      , url: '/api/restaurants/' + this.options.restaurantId +'/contacts/' + this.options.contactId
      , data : this.getProps()
      , success: function() {
          window.location.reload();
        }
      , error: function() {
          alert('Unable to update!');
        }
      });
    },

    remove: function(e) {
      e.preventDefault();
      $.ajax({
        type: 'delete'
      , url: '/api/restaurants/' + this.options.restaurantId + '/contacts/' + this.options.contactId
      , success: function() {
          window.location.reload();
        }
      , error: function() {
          alert('Unable to remove!');
        }
      });
    },
  });
});
