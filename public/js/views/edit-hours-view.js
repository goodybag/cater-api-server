var EditHoursView = Backbone.View.extend({
  tagName: 'div',

  className: 'form-group hours-day row',

  template: Handlebars.partials.hours_day,

  events: {
    'change .all-day': 'changeAllDay',
    'change .closed':  'changeClosed'
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
  },

  render: function() {
    this.$el.html(this.template( this.model.toJSON(), {data: {key: this.model.get('day')}} ))
  },

  attach: function() {
    this.options.hoursListing.append(this.$el);
  },

  changeAllDay: function(e) {
    this.model.set('times', e.target.checked ? [['00:00:00', '23:59:59']] : []);
  },

  changeClosed: function(e) {
    if (e.target.checked) this.model.set('times', []);
  }
});
