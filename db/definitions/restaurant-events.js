/**
 * Restaurant Events Schema
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
  definition.name = 'restaurant_events';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {table: 'restaurants', column: 'id', onDelete: 'cascade'}
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , description: {
      type: types.text
    }
  , date_range: {
  	  type: types.daterange
  	, nullable: false
  	}
  , closed: {
  	  type: types.boolean
  	, nullable: false
  	}
  };

  definition.indices = {};

  return definition;
});
