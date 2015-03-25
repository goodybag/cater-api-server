# Requests

> For HTTP requests and coordinates [Responses](../responses/README.md)

## `.base()`

Creates a Base request

### `.url( url ) -> this`

Sets the URL

### `.method( method ) -> this`

Sets the HTTP verb.

### `.header( key, val ) -> this`

Adds headers

### `.query( [object]/key, val ) -> this`

Adds URL query params.

### `.json( [body] ) -> this`

Sets `json: true` to the underlying request, calls `.header('Content-Type', 'application/json'), and optionally extends the body.

### `.body( body ) -> this`

Extend the body

### `.send( [callback] ) -> Promise`

Send the request

## `.geocode()`

Creates a Google Geocode request

__usage:__

```javascript
require('stamps/requests/geocode').create()
  .address('5336 Krueger Ln., Austin, TX, 78723')
  .send()
  .catch( console.log.bind( console ) )
  .then( function( geoRes ){
    geoRes.status === 'OK';
  });
```

### `.geocode().address( string address ) -> this`

Sets the required `address` propertys

### `.geocode().send( [callback] ) -> Promise`

Overloads [.base().send()](#base-send). Coerces the response to a [Geocode Response](../responses/README.md#geocode)