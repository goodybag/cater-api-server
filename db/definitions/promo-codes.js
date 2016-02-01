/**
 * Promo Codes Schema
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
  definition.name = 'promo_codes';

  definition.schema = {
    id: {
      type: types.serial
    , nullable: false
    , unique: true
    }
  , created_at: {
      type: types.timestamp
    , nullable: false
    , default: 'NOW()'
    }
  , expires_at: {
      type: types.timestamp
    , nullable: true
    }
  , promo_code: {
      type: types.text
    , nullable: true
    }
  , email: {
      type: types.text
    , nullable: false
    }

  };

  return definition;
});
