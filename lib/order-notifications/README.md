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
  requiredOptions - Properties that are required to exist on `options`
  format          - One of 'text' | 'email' | 'voice' (default 'email')
}
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
