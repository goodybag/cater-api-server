var db = require('db');


db.restaurant_delivery_zips.remove({restaurant_id: 25}, function(err, res) {

  db.restaurant_delivery_zips.insert([
  { restaurant_id: 25, zip: '12345' }
, { restaurant_id: 25, zip: '54321' }
  ], function(err, zip) {
    console.log(err, zip);
  });

});
