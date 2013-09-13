var EditHoursView = Backbone.View.extend({
  tagName: 'div',

  className: 'row'

  template: Handlebars.partials.edit_hours,

  events: {
    'change .all-day': 'changeAllDay',
    'change .closed':  'changeClosed'
  },

  selectors: {
    allDay: '.all-day',
    closed: '.closed'
    open: '.open-time'
    close: '.close-time'
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()))
  },

  attach: function() {
    this.options.hoursListing.append(this.$el);
  },

  changeAllDay: function(e) {
    this.model.set(e.target.checked ? {
      open: '00:00:00',
      close: '23:59:59'
    } : {
      open: null,
      close: null
    });
  }
});
