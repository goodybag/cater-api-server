var scheduler = require('../../../lib/scheduler');

var actions = [
  { fn: require('./make-call'), name: 'make-call' }
, { fn: require('./send-sms'), name: 'send-sms' }
, { fn: require('./send-welcome-email-1'), name: 'send-welcome-email-1' }
];

actions.forEach( function( action ){
  scheduler.registerAction(action.name, action.fn);
});

module.exports = actions;