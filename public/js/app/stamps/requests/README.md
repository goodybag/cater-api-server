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

## `.distanceMatrix()`

Creates a Google Distance Matrix request.

See https://developers.google.com/maps/documentation/distancematrix/#JSON for response details. The value gleaned from the response only includes the property `rows`.

__usage:__

```javascript
require('stamps/requests/distance-matrix')()
  .origin('5336 Krueger Ln., Austin, TX, 78723')
  .origin('1900 Ullrich Ave., Austin, TX, 78756')
  .destination('Dallas, TX')
  .send()
  .catch( console.log.bind( console ) )
  .then( function( rows ){
    /* ... */
  });
```

### `.distanceMatrix().origin( string address ) -> this`

Adds a new origin component

### `.distanceMatrix().destination( string address ) -> this`

Adds a new destination component

### `.distanceMatrix().getOriginDestinationQuery() > Object`

Returns an object to be used as url query parameters that coerces the `origins` and `destinations` fields into what google expects (separated by `|`)

### `.distanceMatrix().send( [callback] ) -> Promise`

Overloads [.base().send()](#base-send) and attaches origin/destination details.

__Possible Errors:__

* `errors.google.distanceMatrix.INVALID_REQUEST`
* `errors.google.distanceMatrix.MAX_ELEMENTS_EXCEEDED`
* `errors.google.distanceMatrix.OVER_QUERY_LIMIT`
* `errors.google.distanceMatrix.REQUEST_DENIED`
* `errors.google.distanceMatrix.REQUEST_DENIED`