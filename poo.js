var scheduler = require('./lib/scheduler');

scheduler.enqueue('send-sms', new Date(), {
  to: '7135178077',
  from: '5122706333',
  url: 'https://www.gdsadsaoodybag.com/orders/1160/voice',
  ifMachine: 'Continue',
  method: 'GET' }
, function() {
  console.log(arguments);
});
