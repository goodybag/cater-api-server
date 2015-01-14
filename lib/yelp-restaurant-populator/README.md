# Yelp Restaurant Populator

> API for getting necessary Yelp data and coercing it into our data model

__Usage__

```javascript
var yrp = require('./lib/yelp-restaurant-populator');

// Populate restaurant 25
yrp.populate( 25, function( error ){
  /* ... */
});
```

## API

#### `.populate( restaurant_id, [callback( error )] )`

Runs all data strategies and populates the restaurant

#### `.getYelpData( restaurant_id, callback( error, data ) )`