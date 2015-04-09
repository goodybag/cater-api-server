if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Address = require('../models/address');

  return module.exports = Backbone.Collection.extend({
    model: Address,
    comparator: 'id'
  });
});
