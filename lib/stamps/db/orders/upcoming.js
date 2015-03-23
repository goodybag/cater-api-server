var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function upcomingOrders() {
    if ( this.upcoming ) {
      this.$query.datetime = { $is_future: true };
      this.$query.status = 'accepted';
      this.$options.order = this.$options.order || [];
      this.$options.order.push({ expression: 'datetime asc' });
    }
  });
});
