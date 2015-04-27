# Orders

## Stamps

### Base

> stamps/order/base.js

#### Properties

#### Methods

### Delivery Fee

> stamps/order/delivery-fee.js

Composes [Distance/Base](../distance/base.js)

Calculates the delivery fee based on the number of miles returned by `.miles()`.

#### Properties

##### `.pricePerMile` Number

Default: 0, Indicates the price in cents per mile.

##### `.basePrice` Number

Default: 0, Indicates the base price to be added to all calculations in cents.

#### Methods

##### `.getPrice()`

Returns the delivery fee.

### Fulfillability

#### Properties

##### `.restaurant` Object Required

The full restaurant object

##### Order Params

The following properties on the order are optional params that affect the fulfillability result:

* zip
* date
* time
* guests

##### `.fulfillabilityRequirements` Function[]

#### Methods

##### `.isFulfillable()`

Whether or not the provided parameters can be fulfilled with the provided restaurant.

##### `.getAllSupportedDeliveryZips()`

Gets all the zips that this restaurant can deliver to, including those covered by a courier if a restaurant supports that.

##### `.getAllSupportedLeadTimes()`

Gets all the lead times this restaurant supports, including those covered by a courier if a restaurant supports that.

##### `.getDeliveryServiceZips()`

Gets all delivery zips from all of the possible delivery services for this restaurant's region.

##### `.getAllOriginZips()`

Gets all of the zips from all of this restaurants locations along with the base zip on the restaurant.