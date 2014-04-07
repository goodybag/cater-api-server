/**
 * Emails Schema
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
  definition.name = 'emails';

  definition.schema = {
    id:           { type: types.serial, pk: true }
  , subject:      { type: types.text }
  , to:           { type: types.text, nullable: false }
  , from:         { type: types.text, nullable: false }
  , body:         { type: types.text }
  , log:          { type: types.json }
  , status:       { type: types.email_status, nullable: false, default: 'pending' }
  , send_date:    { type: types.timestamp, nullable: false, default: 'now()' }
  , created_at:   { type: types.timestamp, nullable: false, default: 'now()' }
  };

  definition.indices = {};

  return definition;
});
