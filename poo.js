var scheduler = require('./scheduler');


var date = new Date();
date.setMinutes(date.getMinutes() + 2);
scheduler.queue('make-call', date, {
  to: 'aa7135178077',
  from: 'a5122706555',
  url: 'https://www.goodybag.com/orders/1066/voice',
  ifMachine: 'Continue',
  method: 'GET'
}, function() {
  console.log(arguments);
});
