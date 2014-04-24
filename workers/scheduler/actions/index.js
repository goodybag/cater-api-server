var scheduler = require('../../../lib/scheduler');

var actions = [
  { fn: require('./make-call'), name: 'make-call' }
, { fn: require('./send-sms'), name: 'send-sms' }
];

actions.forEach( function( action ){
  scheduler.registerAction(action.name, action.fn);
});

module.exports = actions;