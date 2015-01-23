var db =  require('./db');
var opts = { many: [{ table: 'restaurant_delivery_zips' }] };
db.restaurants.findOne(35, opts, function(e, r) {
  console.log(r);
});
