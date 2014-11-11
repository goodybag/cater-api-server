define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Amenity = require('../models/amenity');

  var Amenities = module.exports = Backbone.Collection.extend({
    model: Amenity,
    comparator: 'id'
  });

  return Amenities;
});
