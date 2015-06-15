/**
 * RestaurantLocations Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

var
  types = require('../data-types')
;

define(function(require) {
  var definition = {};
  definition.name = 'restaurant_locations';

  definition.schema = {
    id:                 { type: types.serial, nullable: false, pk: true }
  , restaurant_id:      { type: types.int , nullable: false , references: { table: 'restaurants', column: 'id' } }
  , name:               { type: types.text }
  , street:             { type: types.text , nullable: false }
  , street2:            { type: types.text }
  , city:               { type: types.text, nullable: false }
  , state:              { type: types.varchar(2), nullable: false }
  , zip:                { type: types.varchar(5) , nullable: false }
  , is_default:         { type: types.bool, nullable: false }
  , phone:              { type: types.varchar(10), nullable: false, checks: ["similar to '[[:digit:]]{10}'"] }
  , price_per_mile:     { type: types.int, default: 0 }
  , base_delivery_fee:  { type: types.int, default: 0, nullable: false }
  , lat_lon:            { type: types.point }
  };

  definition.indices = {};

  return definition;
});
