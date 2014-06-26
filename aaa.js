var db = require('./db');
var qlock = require('qlock');
var qlk = new qlock();
qlk.profile('orders');
// db.orders.findOne(1023, function(err, res) { 
//   qlk.profile('orders');
//   console.log(err, res);
// })


var options = {
  statusDateSort: {
    status: 'submitted'
  , alias: 'submitted_date'
  }
};
db.orders.find({id: 1023}, options,function(err, res) { 
  qlk.profile('orders');
  console.log(err, res);
})
