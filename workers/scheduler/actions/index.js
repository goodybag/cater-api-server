var scheduler = require('../../../lib/scheduler');

var actions = [
  { fn: require('./make-call'), name: 'make-call' }
, { fn: require('./send-sms'), name: 'send-sms' }
, { fn: require('./send-welcome-email-1'), name: 'send-welcome-email-1' }
, { fn: require('./build-pdf'), name: 'build-pdf' }
, { fn: require('./upload-to-s3'), name: 'upload-to-s3' }
, { fn: require('./notify-delivery-service'), name: 'notify-delivery-service' }
, { fn: require('./redeem-reward'), name: 'redeem-reward' }
, { fn: require('./delivery-service-order'), name:'delivery-service-order' }
, { fn: require('./sms-gb-asap-after-hours'), name: 'sms-gb-asap-after-hours' }
];

actions.forEach( function( action ){
  scheduler.registerAction(action.name, action.fn);
});

module.exports = actions;