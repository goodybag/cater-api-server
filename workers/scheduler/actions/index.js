var scheduler = require('../../../lib/scheduler');

var actions = [
  { fn: require('./send-order-notification'), name: 'send-order-notification' }
, { fn: require('./send-welcome-email'), name: 'send-welcome-email' }
, { fn: require('./build-pdf'), name: 'build-pdf' }
, { fn: require('./upload-to-s3'), name: 'upload-to-s3' }
, { fn: require('./notify-delivery-service'), name: 'notify-delivery-service' }
, { fn: require('./redeem-reward'), name: 'redeem-reward' }
, { fn: require('./delivery-service-order'), name:'delivery-service-order' }
, { fn: require('./sms-gb-ds-after-hours'), name: 'sms-gb-ds-after-hours' }
, { fn: require('./non-contracted-restaurant-order'), name: 'non-contracted-restaurant-order' }
];

actions.forEach( function( action ){
  scheduler.registerAction(action.name, action.fn);
});

module.exports = actions;
