var stampit = require('stampit');

module.exports = stampit().enclose(function() {
  this.transforms.push(function joinRestaurant() {
    // Default opt-in
    if ( this.restaurant === false ) return;

    this.$options.one = this.$options.one || [];
    this.$options.one.push({
      table: 'restaurants'
    , alias: 'restaurant'
    , one: [ { table: 'regions', alias: 'region' }
           , { table: 'restaurant_locations', alias: 'location' }
           ]
    });
  });
});
