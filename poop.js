var db = require('./db');

db.orders.find({ id: 5195 }, function(e, o) {
  console.log(o[0].points);
}); 
