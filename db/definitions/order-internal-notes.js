/**
 * Order Internal Notes Schema
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
  definition.name = 'order_internal_notes';

  definition.schema = {
    id:         { type: 'serial', pk: true }
  , order_id:   { type: 'int', references: { table: 'orders', column: 'id' } }
  , user_id:    { type: 'int', references: { table: 'users', column: 'id' } }
  , body:       { type: 'text', nullable: false, default: "''" }
  , created_at: { type: 'timestamp', nullable: false, default: 'now()'}
  };

  definition.indices = {};

  /**
   * Gets this DAL's column list but with the created_at
   * column time zone set to the passed in time zone
   * @param  {String} timezone A timezone valid to PG
   * @return {Array}           The column list
   */
  definition.getColumnListForTimezone = function( timezone ){
    return Object
      .keys( this.schema )
      .filter( function( k ){ return k !== 'created_at' } )
      .concat({
        expression: "created_at at time zone ':tz' as created_at"
                      .replace( ':tz', timezone )
      });
  };

  return definition;
});
