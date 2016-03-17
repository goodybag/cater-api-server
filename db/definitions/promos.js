/**
 * Promos Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
 var define = function (factory) {
   module.exports = factory(require, exports, module);
 };
}

var types = require('../data-types');

define(function(require) {
  var definition = {};
  definition.name = 'promos';

  definition.schema = {
    promo_code: {
      type: types.citext
    , nullable: false
    , pk: true
    }
  , type: {
      type: types.text
    , nullable: false
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , description: {
      type: types.text
    , nullable: true
    }
  , data: {
      type: types.jsonb
    , nullable: false
    , default: "'{}'::jsonb"
    }
  , recipients: {
      type: types.array( types.text )
    , nullable: false
    }
  , expires_on: {
      type: types.timestamptz
    , nullable: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'now()'
    }
  };

  definition.indices = { };

  return definition;
});
