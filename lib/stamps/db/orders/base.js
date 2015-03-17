var stampit = require('stampit');

module.exports = stampit().state({
  query: {}         // input query
, $query: {}        // mosql query
, $options: {}      // mosql options
, transforms: []    // list of functions to compose $query, $options
}).methods({
  reset: function() {
    this.$query = {};
    this.$options = {};
  }
});
