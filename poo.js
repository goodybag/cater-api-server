var scheduler = require('./scheduler');


var date = new Date();
date.setMinutes(date.getMinutes() + 2);
scheduler.queue('make-call', date, {
  to: '7135178077',
  from: '5122706555',
  url: 'https://www.goodybag.com/orders/1066/voice',
  ifMachine: 'Continue',
  method: 'GET'
}, function() {
  console.log(arguments);
});
