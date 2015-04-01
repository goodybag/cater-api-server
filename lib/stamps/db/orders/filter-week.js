var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function week() {
    if ( this.week ) {
      this.$query['submitted_dates.submitted'] = this.$query['submitted_dates.submitted'] || [];
      this.$query['submitted_dates.submitted'].push({ $extract: { field: 'week', $equals: this.week, timezone: 'orders.timezone' } });
    }
  });
});
