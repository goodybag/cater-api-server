# Restaurant

__Usage:__

```javascript
var restaurants = require('stamps/restaurant');

// Create a stamp using all restaurant protos
var restaurant = restaurants.create({ id: 7 });

// Create a custom stamp
restaurant = require('stampit')()
  .compose( require('stamps/restaurant/gleaning') )
  .compose( require('stamps/restaurant/db') )
```

## Stamps

### Gleaning

#### Properties

##### `.mealTypeMap -> Object`

#### Methods

##### `.getMealTypesFromHours() -> Array`

Get the meal types based on the delivery_times on this object