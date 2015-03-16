var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function week() {
    if (this.order) {
      this.$options.order = this.$options.order || [];

      if ( typeof this.order === 'string' ) {
        this.$options.order.push(this.order);
      } else if ( Array.isArray(this.order) ) {
        this.$options.order = this.$options.order.concat(this.order);
      } else {
        throw new Error('Orders stamp requires `order by` string or array');
      }
    }
  });
});
