var EditHoursView = Backbone.View.extend({
  tagName: 'div',

  className: 'form-group hours-day row',

  template: Handlebars.partials.hours_day,

  events: {
    'change .all-day': 'changeAllDay',
    'change .closed':  'changeClosed',
    'change .time': 'changeTimes'
  },

  selectors: {
    allDay: '.all-day',
    closed: '.closed',
    open: '.open-time',
    close: '.close-time'
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

  setPickers: function() {
    this.pickers = _.map(this.$el.find('input.time'), function(input) {
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
    var inputs = this.$el.find('input.time');
    e.target.checked ? inputs.attr('disabled', 'disabled') : inputs.removeAttr('disabled');
  },

  changeTimes: function(e) {
    this.model.set('times', _.compact(_.map(this.$el.find('.open-period'), function(el) {
      var open = $(el).find('.open-time').val() || null;
      var close = $(el).find('.close-time').val() || null;
      return open || close ? [open, close] : null;
    })));
  }
});
