var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function month() {
    if ( this.month ) {
      this.$query['submitted_dates.submitted'] = this.$query['submitted_dates.submitted'] || [];
      this.$query['submitted_dates.submitted'].push({ $extract: { field: 'month', $equals: this.month, timezone: 'orders.timezone' } });
    }
  });
});
