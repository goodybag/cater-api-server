var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function year() {
    if ( this.year ) {
      this.$query['submitted_dates.submitted'] = this.$query['submitted_dates.submitted'] || [];
      this.$query['submitted_dates.submitted'].push({ $extract: { field: 'year', $equals: this.year, timezone: 'orders.timezone' } });
    }
  });
});
