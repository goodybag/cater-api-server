# Addresses

__Usage__

```javascript
var Addresses = require('stamps/addresses');

...

Addresses({
  street: '1900 Ullrich Ave'
, city:   'Austin'
, state:  'TX'
, zip:    '78756'
}).toString() // => 1900 Ullrich Ave, Austin, TX 78756
```

## User Addresses DB

__Usage__

```javascript
var Addresses = require('stamps/addresses/user-addresses-db');
var GeocodeRequest = require('stamps/requests/geocode');

GeocodeRequest()
  .address( Addresses( req.body ).toString() )
  .send( function( error, result ){
    if ( error ){
      throw error;
    }

    var address = Addresses( result.toAddress() );

    address.is_default = true;
    address.user_id = 11;
    address.phone = '4693875077';

    address.save( function( error ){
      if ( error ){
        throw error;
      }

      console.log( result );

      res.json( address );
    });
  });
```

### User Addresses API

#### `.setLogger( LoglogLogger )`

Sets the logger on this instance.

#### `.save( callback( error, this ) )`

Persists the User Address to the database (`user_id` required).