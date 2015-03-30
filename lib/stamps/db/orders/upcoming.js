var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function upcomingOrders() {
    if ( this.upcoming ) {
      this.$query.datetime = { $custom: ['datetime at time zone timezone > now()'] };
      this.$query.status = 'accepted';
      this.$options.order = this.$options.order || [];
      this.$options.order.push({ expression: 'datetime asc' });
    }
  });
});
