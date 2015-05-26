var config = require('../../../config');

module.exports = require('../email')({
  template: 'order-email/user-order-accepted'

, description: [
    'Sends the user on the order an email notifying them '
  , 'that their order was accepted'
  ].join('')

, to: function( order ){
    return order.user.email;
  }

, from: function( order ){
    return config.emails.orders;
  }

, subject: function( order ){
    return [ 'Goodybag order (#', order.id, ') has been accepted' ].join('');
  }
});