var Model = require('./model');
var utils = require('../utils');

Restaurant = Model.extend({
  validate: function() {
    //TODO: validate using schema.  probably ought to put that part in super
  }
}, {
  table: 'restaurants',
  schema: {
    id: {},
    name: {
      type: 'string'
    },
    street: {
      type: 'string'
    },
    city: {
      type: 'string'
    },
    state: {
      type: 'string'
    },
    zip: {
      type: 'string'
    },
    phone: {
      type: 'string'
    }
  }
})

module.exports = Restaurant;
