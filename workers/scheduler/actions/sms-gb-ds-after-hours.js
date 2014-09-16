var utils   = require('../../../utils');
var config  = require('../../../config');
var twilio  = require('twilio')(config.twilio.account, config.twilio.token);
var slogger = require('../logger');

module.exports = function(job, jobDone) {
  var logger = slogger.create('SMS GB Courier After Hours', {
    data: job
  });

  var msg = {
    from: config.phone.orders
  , body: [
      'Goodybag DS Order #'
    , job.data.orderId
    , 'was placed over the weekend or after hours. Please ensure the delivery service'
    , 'can fulfill this order.'
    ].join(' ')
  };

  logger.info('Sending Message', msg);

  utils.async.each(config.deliveryServices.supportPhones, function(phone, textDone) {
    msg.to = phone;
    twilio.sendSms(msg, function(error) {
      if ( error ) logger.error('Could not send sms', { error: error });
      textDone( error );
    });
  }, jobDone);
}
