/**
 * Tags Schema
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
  definition.name = 'tags';

  definition.schema = {
    name: {
      type: types.text
    , pk: true
    }
  };

  definition.indices = {};

  return definition;
});
