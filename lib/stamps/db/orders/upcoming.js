var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function upcomingOrders() {
    if ( this.upcoming ) {
      this.$query.datetime = { $custom: [ 'datetime at time zone timezone > (now() - $1::interval)', this.upcoming ] };
      this.$query.status = 'accepted';
      this.$options.order = this.$options.order || [];
      this.$options.order.push({ expression: 'datetime asc' });
      this.$options.one = this.$options.one || [];
      this.$options.one.push({ table: 'delivery_services', alias: 'deliveryService' });
      this.$options.one.push({ table: 'restaurant_locations', alias: 'location' });
    }
  });
});
