if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    return module.exports = factory(require, exports, module);
  };
}

// Map diet tag enums to display text and icon classes
define(function(require, exports, module) {
  module.exports = {
    glutenFree:  { name: 'Gluten-Free', className: 'gluten-free' }
  , dairyFree:   { name: 'Dairy-Free',  className: 'dairy-free' }
  , vegetarian:  { name: 'Vegetarian',  className: 'vegetarian' }
  , vegan:       { name: 'Vegan',       className: 'vegan' }
  , halal:       { name: 'Halal',       className: 'halal' }
  , kosher:      { name: 'Kosher',      className: 'kosher' }
  , spicy:       { name: 'Spicy',       className: 'spicy' }
  , nuts:       { name: 'Contains Nuts', className: 'nuts' }
  };
  return module.exports;
});
