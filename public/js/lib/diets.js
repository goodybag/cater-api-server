if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    return module.exports = factory(require, exports, module);
  };
}

// Map diet tag enums to display text and icon classes
define(function(require, exports, module) {
  module.exports = {
    glutenFree:  { name: 'Gluten-Free', class: 'gluten-free' }
  , dairyFree:   { name: 'Dairy-Free',  class: 'dairy-free' }
  , vegetarian:  { name: 'Vegetarian',  class: 'vegetarian' }
  , vegan:       { name: 'Vegan',       class: 'vegan' }
  , halal:       { name: 'Halal',       class: 'halal' }
  , kosher:      { name: 'Kosher',      class: 'kosher' }
  };
  return module.exports;
});
