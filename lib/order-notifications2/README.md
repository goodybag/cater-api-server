# Order Notifications

Order notifications are reified actions related to an order.  There are certain meta data requirements that aid in displaying these actions in a user interface. The best way to explain is to jump into a high-level usage example:

__Creating and sending a notification object__

```javascript
var notifications = require('./order-notifications2');

// Get user order accepted email notification factory
var UserOrderAcceptedEmail;

try {
  UserOrderAcceptedEmail = notifications.get('user-order-accepted-email').create();

  // Alternatively, you directly access it:
  UserOrderAcceptedEmail = notifications.UserOrderAcceptedEmail.create();
} catch ( e ){
  console.warn('Invalid notification');
  process.exit();
}

// Create a notification object tied to order 7000, user 123
var notification = UserOrderAcceptedEmail(7000, 123);

// Send the notification
notification.send( function( error, result ){
  /* ... */
});
```

__Creating a notification factory__

We've abstracted the process of defining a notification to simply passing an object literal to the notification factory factory (yes, a factory that creates factories). We automatically instantiate the factory and add it to the registry if your notification is defined in [./notifications](./notifications).

```javascript
var trello = require('trello').createClient(
  require('config').trello
);

var markdown = require('markdown');
var usd = require('usd');

var tmpls = {
  title: function( order ){
    return [ '#', order.id, ' ', order.restaurant.id ].join('');
  }

, body: function( order ){
    return [
      'https://www.goodybag.com/admin/orders/' + order.id
    , ''
    , '* User: [https://www.goodybag.com/admin/users/' + order.user.id
    , '* Total: $' + usd().pennies( order.total ).dollars()
    , ''
    , '## Restaurant'
    , ''
    , '...'
    ].join('\n')
  }

, htmlPreview: function( order ){
    return [
      '<h1>' + tmpls.title( order ) + '</h1>'
    , markdown.parse( tmpls.body( order ) ).toHTML()
    ].join('\n');
  }
};

module.exports = {
  build: function( order, options, logger, callback ){
    var build = {
      cardDetails: {
        title: tmpls.title( order )
      , body: tmpls.body( order )
      , board: 'order-board-id'
      }
    };

    if ( options.render !== false ){
      build.html = tmpls.htmlPreview( order );
    }

    return callback( null, );
  }

, send: function( build, order, options, logger, callback ){
    trello.cards( build.cardDetails, callback );
  }
};
```

## API

### Root

The root API is very minimal. It provides access to create Notification Factory Factories and also serves as a namespace for Notification Factories themselves.

The root module `index.js` will register all notifications in the ./notifications directory. If the definition is missing an ID or Name, it will be gleaned from the filename. For instance, `user-order-accepted-email.js` gets id `user-order-accepted-email` and a name of `User Order Accepted Email`.

##### `.get(string id) -> NotificationFactory`

Gets a notification factory by notification id.

### Notification Factories

[./notification.js](./notification.js) contains the logic for creating factories that create [notification](#notification) instances. It exports a single Function:

##### `([definition](#definition)) -> NotificationFactory

Given a notification definition, returns a NotificationFactory.

##### Definition

A Definition object has the following signature:

```javascript
{
  // required - Identifies the notification type
  id: 'notification-unique-id'
  // required - Nice name for user interfaces
, name: 'Nice name for Notification'
  // required - function for building all prerequisite material
  // before actually committing to sending
, build: function( order, options, logger, callback ){
    callback( error, {
      html: '...' // required - For previewing
    , to: '...'   // required - A recipient-like value
                  // could just be a service name or an email address
    })
  }
  // required - Performs the actual end-goal of hte notification
  // such as making an api request or sending an email
, send: function( build, order, options, logger, callback ){

  }
  // Set of keys that _must_ be present on options
  // This allows us to inform action UIs to require
  // a parameter
  // TODO: perhaps use JSON schema validation?
, requiredOptions: []
  // Set of keys that can be optionally present on
  // the options object. This informs action UIs
  // to display an optional parameter field
, options: []
  // Optional description to help inform UIs
, description: '...'
  // Optional Function that describes whether this notification
  // applies to the associated order
, isAvailable: function( order ) -> boolean
}
```

### Notification

Create a notification instance from a Notification Factory:

```javascript
// Create a Dropoff delivery notification for order 1000
// Using actor user 123
var notification = notifications.DropoffCreateDelivery.create(1000, 123)
```

NotificationFactory.create has the following function signature:

```javascript
NotificationFactory.create( order_id, user_id ) -> Notification
```

The notification has the following members:

#### Properties

```javascript
{
  // The order object
  order:    order
  // User that initiated the notification
, userId:   userId
  // Notification definition
, def:      def
  // Options passed to notification
, options:  options
  // Loglog logging instance
, logger:   logger.create('Notification', {
              order: { id: order.id }
            , options: options
            })
}
```

#### Methods

##### `build( callback )`

Fetches the order if needed, and calls the defintion `.build(...)` function with the current notification state.

##### `send( callback )`

Calls `this.build(...)`, passes the result to the definition `.send(...)` function with the current notification state.

##### `save( build, callback )`

Saves the current notification state to the data audit trail along with data passed from `build`.

##### `fetchOrder( callback )`

Retrieves order data from the database getting all necessary fields for order notifications and attaches the order to the notification object.

##### `validateOptions()`

This function is called when a notification is instantiated. Checks the options passed into the notification to ensure they match the notification requirements. Throws an error if not.

##### `isValidOrder() -> Boolean`

Whether or not the order on the notification is valid (determines whether or not we need to do an additional fetch call).

### Notification Sub-Types

Since declaring notification involves creating a basic object structure, we can easily create abstraction on top of that.

#### Notification Sub-Types: Email

The email sub-type factory has the following signature:

```javascript
{
  // Template teh email will use
  template: 'order-email/user-order-accepted'

  // The recipients field of the email
, to: function( order ){
    return order.user.email;
  }

  // The `from` field of the email
, from: function( order ){
    return config.emails.orders;
  }

  // The `subject` field of the email
, subject: function( order ){
    return [ 'Goodybag order (#', order.id, ') has been accepted' ].join('');
  }
}
```

#### Notification Sub-Types: SMS

TODO

#### Notification Sub-Types: Voice

TODO
