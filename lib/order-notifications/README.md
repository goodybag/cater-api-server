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
}
```
