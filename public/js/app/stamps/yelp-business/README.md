# Yelp Business

__Usage:__

```javascript
var ybusinesses = require('stamps/yelp-business');

// Create a stamp using all protos
var ybiz = ybusinesses.create({ id: 7 });

// Create a custom stamp
ybiz = require('stampit')()
  .compose( require('stamps/yelp-business/coercions') )
  .compose( require('stamps/yelp-business/fetch') )
```

## Stamps

### Coercions

#### Properties

##### `.allCuisines -> Array`

An array of all of the cuisines we support.

##### `.categories -> Array`

Array of categories from Yelp's business API.

#### Methods

##### `.categoriesToGbCuisines() -> Array`

Coerces `this.categories` to GB-style cuisines array

-----------------------------------------------------

### Fetch

#### Properties

##### `.client -> YelpClient`

Yelp client - this is provided at run-time.

#### Methods

##### `.fetch( [callback( error, result )] )`

Calls out to the yelp API and fetches business `this.id`. If `this.id` is not available, this method will throw an error.

__Example:__

```javascript
var yelpBiz = require('stamps/yelp-business/fetch').create({ id: '...' });
yelpBiz.fetch( function( error ){
  if ( error ){
    /* ... */
  }

  console.log( yelpBiz.categories ); // [ [ ... ], [ ... ], ... ]
});
```