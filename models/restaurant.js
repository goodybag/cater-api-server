var Model = require('./model');
var utils = require('../utils');

Restaurant = Model.extend({
  validate: function() {
    //TODO: validate using schema.  probably ought to put that part in super
  }
}, {
  table: 'restaurants'
})

module.exports = Restaurant;
