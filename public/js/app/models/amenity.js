/**
 * Restaurant Amenity Model
 */
define(function(require, exports, module) {
  var amanda = require('amanda');
  var utils = require('utils');

  var Amenity = module.exports = utils.Model.extend({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: ['string', 'null'],
          required: false
        },
        description: {
          type: ['string', 'null'],
          required: false
        },
        price: {
          type: 'integer',
          minimum: 0,
          "default": 0,
          required: true
        },
      }
    },

    getTotalPrice: function() {
      if ( this.get('scale') === 'multiply' && this.get('quantity') ) {
        return this.get('quantity') * this.get('price');
      } else {
        return this.get('price');
      }
    },

    urlRoot: '/api/amenities'
  });

  return Amenity;
});
