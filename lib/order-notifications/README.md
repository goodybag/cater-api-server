# Order Notifications

Register, view, and send order notifications.

## API

```javascript
var notifier = require('./lib/order-notifier');
```

### notifier.getNotification( id, orderId|Order, [callback] )

Gets the notification registered by `id` as `callback( error, notification )`.
Either pass an order id or an instance of the Order database model.

__Example:__

```javascript
var notifier = require('./lib/order-notifier');

notifier.register({
  'some-type'
, name: 'Something'
, build: function( order, logger, options, callback ){
    var email = {
      to:       'some@one.com'
    , from:     'me@me.com'
    , subject:  'ohai'
    , body:     'Yes, hello, this is order #' + order.attributes.id
    };

    return callback( null, email );
  }
});

notifier.getNotification( 'some-type', 52, function( error, result ){
  if ( error ) /* ... */

  // => Yes, hello, this is order #52
  console.log( result.body );
});
```

### notifier.send( id, orderId|Order, [callback] )

Gets the notification and sends it to notification recipients.

### notifier.register( def )

Registers a new notification.

__`def` Properties:__

```
// `*` is required
{
* id              - Unique id for the notification
* name            - Nice name for notification
* build           - function( order, logger, options, callback )
                    defines the notification.
                  - callback( error, notificationObj ) to define
  type            - Category of notification, i.e. "submitted"
  description     - Description of the notification
  isAvailable     - function ( order ) return truthy value
  requiredOptions - Properties that are required to exist on `options`
  format          - One of 'text' | 'email' | 'voice' (default 'email')
}
```

For the `def.build` function, you must callback with the notification object. For the following formats, you must supply
some required fields:

* __email__
  * to - list of recipient email addresses
  * from - the sender's email address
  * subject - the email subject
  * html - the email body
* __sms__
  * to - list of recipient phone numbers for texting
  * from - the sending phone number
  * html - the sms body text
* __voice__
  * to - list of recipient phone numbers for calling
  * from - the caller's phone number
  * html - the voice message  (optional for notification previewing)
  * url - a publicly accessible url for twilio xml formatted phone messages
     * Example `/orders/:order_id/voice` serves our automated submitted voice messages

Here's a simple example of building a voice notification

```js
build: function( order, logger, options, callback ) {
  var notification = {
    to: order.user.phone_number
  , from: '2813308804'
  , html: 'Want a free amazon giftcard from Goodybag.com? Finish placing order #' + order.id + 'by today to receive $20 giftcard.'
  , url: getPromoUrl(order)
  }
  callback(null, notification);
});
```

### Definition Examples

Email notification
```js
{
  type: 'submitted'
, id: 'user-order-submitted'
, name: 'User Order Submitted'
, format: 'email' // can be omitted, format: 'email' is by default
, description: 'Sends the user an order submitted notice'
, isAvailable: function( order ){
    return order.type === 'courier';
  }
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    };

    var email = {
      to:         order.user.email
    , from:       config.emails.orders
    , subject:    [ 'Goodybag order (#', order.id, ') has been submitted' ].join('')
    };

    app.render( 'order-email/user-order-submitted', viewOptions, function( error, html ){
      email.html = html;
      callback( error, email );
    });
  }
}
```

SMS notification
```js

notifier.register({
  type: 'submitted'
, id: 'restaurant-order-submitted-sms'
, name: 'Restaurant Order Submitted SMS'
, format: 'sms'
, description: 'Send a text to the restaurant\'s SMS phone numbers'
, isAvailable: function( order ){
    return order.type === 'courier';
  }
, build: function( order, logger, options, callback) {
    var viewOptions = {
      layout: false
    , order: order
    };

    var sms = {
      to: order.restaurant.contacts.sms_phones
    , from: '512-123-1234'
    };

    app.render( 'sms/restaurant-order-submitted-sms', viewOptions, function( error, html ){
      sms.html = html;
      callback(error, sms);
    });
  }
});
```
