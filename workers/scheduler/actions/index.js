var scheduler = require('../../../lib/scheduler');

var actions = {
  makeCall:       { fn: require('./make-call'), name: 'make-call' }
, sendSms:        { fn: require('./send-sms'), name: 'send-sms' }
};

for( var key in actions ) {
  var action = actions[key];
  scheduler.registerAction(action.name, action.fn);
}

module.exports = actions;