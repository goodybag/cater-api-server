# Order Notifications

Order notifications are reified actions related to an order.  There are certain meta data requirements that aid in displaying these actions in a user interface. The best way to explain is to jump into a high-level usage example:

__Creating and sending a notification object__

```javascript
var notifications = require('./order-notifications2');

// Get user order accepted email notification factory
try {
  var UserOrderAcceptedEmail = notifications.get('user-order-accepted-email');
} catch ( e ){
  console.warn('Invalid notification');
  process.exit();
}

// Create a notification object tied to order 7000
var notification = UserOrderAcceptedEmail(7000);

// Send the notification
notification.send( function( error ){
  
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