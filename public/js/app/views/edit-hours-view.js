define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var utils = require('utils');
  var Hours = require('app/models/hours');

  return module.exports = Backbone.View.extend({
    tagName: 'div',

    className: 'form-group hours-day row',

    template: Handlebars.partials.hours_day,

    events: {
      'change .all-day': 'changeAllDay',
      'change .closed':  'changeClosed',
      'change .time': 'changeTimes',
      'click .add-period': 'addPeriod',
      'click .remove-period': 'removePeriod'
    },

    selectors: {
      allDay: '.all-day',
      closed: '.closed',
      open: '.open-time',
      close: '.close-time',
      timeInputs: 'input.time'
    },

    initialize: function(options) {
      if (!this.model) this.model = new Hours();
      this.listenTo(this.model, {
        'change': this.render
      }, this);

      this.setPickers();
    },

    render: function() {
      this.$el.html(this.template( this.model.toJSON(), {data: {key: this.model.get('day')}} ))
      this.setPickers();
    },

    attach: function() {
      this.options.hoursListing.append(this.$el);
    },

    reset: function() {
      this.model.set('times', []);
    },

    setPickers: function() {
      this.pickers = _.map(this.$el.find(this.selectors.timeInputs), function(input) {
        return $(input).pickatime({
          format: 'hh:i A',
          interval: 15
        }).pickatime('picker');
      });
    },

    changeAllDay: function(e) {
      this.model.set('times', e.target.checked ? [['00:00:00', '23:59:59']] : []);
    },

    changeClosed: function(e) {
      this.model.set('times', []);
      var inputs = this.$el.find(this.selectors.timeInputs);
      e.target.checked ? inputs.attr('disabled', 'disabled') : inputs.removeAttr('disabled');
    },

    changeTimes: function(e) {
      this.model.set('times', _.compact(_.map(this.$el.find('.open-period'), function(el) {
        var open = utils.timeFormatter($(el).find(this.selectors.open).val()) || null;
        var close = utils.timeFormatter($(el).find(this.selectors.close).val()) || null;
        return open || close ? [open, close] : null;
      }, this)));
    },

    addPeriod: function(e) {
      this.$el.find(this.selectors.closed).attr('checked', false);
      this.$el.find(this.selectors.timeInputs).removeAttr('disabled');
      this.$el.find('.hours-listing').append(Handlebars.partials.edit_hours(['', ''], {data: {index: this.model.get('times').length || 1}}));
      this.setPickers();
    },

    removePeriod: function(e) {
      $(e.target).closest('.open-period').remove();
    }
  });
});
