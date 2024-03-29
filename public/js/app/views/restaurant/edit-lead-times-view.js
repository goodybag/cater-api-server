define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({

    events: {
      'submit': 'save'
    , 'click .add-lead-time': 'addLeadTime'
    , 'click .remove-lead-time': 'removeLeadTime'
    },

    fieldMap: {
      delivery_times: '.time'
    , lead_times: '.lead-times'
    },

    fieldGetters: _.extend({
      delivery_times: function() {
        var models = _.pluck(this.options.hours, 'model')
        return _.object(_.invoke(models, 'get', 'day'), _.invoke(models, 'toJSON'));
      },

      lead_times: function() {
        return _.compact(_.map(this.$el.find('.lead-time'), function(el) {
          var guests = +$(el).find('.lead-max-guests').val();
          var hours = +$(el).find('.lead-hours').val();
          var minutes = +$(el).find('.lead-minutes').val();
          var cancel = +$(el).find('.lead-cancel-time').val();
          return {
            max_guests: !_.isNaN(guests) ? guests : null,
            lead_time: !_.isNaN(minutes) ? hours * 60 + minutes : hours * 60,
            cancel_time: !_.isNaN(cancel) ? cancel : null
          };
        }));
      }
    }, EditRestaurantView.prototype.fieldGetters ),


    addLeadTime: function(e) {
      this.$el.find('.lead-times-list').append(Handlebars.partials.lead_time({}));
    },

    removeLeadTime: function(e) {
      e.preventDefault();
      $(e.target).closest('.lead-time').remove();
    },

    initialize: function() {

    }

  });
});
