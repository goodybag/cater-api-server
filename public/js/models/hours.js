var Hours = Backbone.Model.extend({
  allDay: function() {
    var ref = [[0, 0, 0], [23, 59, 59]];
    var times = [this.get('open'), this.get('close')]
    var ints = _.map(times, function(time) { return _.map(time.split(':'), function(part) { return parseInt(part); }); });
    return _.isEqual(ref, ints);
  },

  closed: function() {
    return !this.get('open') && !this.get('close');
  },

  parse: function(attrs, options) {
    return _.isArray(attrs) ? _.object(['open', 'close'], attrs) : attrs;
  },

  toJSON: function() {
    return !this.closed() ? [this.get('open'), this.get('close')] : [];
  }
});
