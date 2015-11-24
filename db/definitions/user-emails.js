/**
 * User Emails Schema
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
   definition.name = 'user_emails';

   definition.schema = {
     id: {
       type: types.serial
     , nullable: false
     , unique: true
     }
   , created_at: {
       type: types.timestamptz
     , nullable: false
     , default: 'NOW()'
     }
   , user_id: {
       type: types.int
     , references: {table: 'users', column: 'id'}
     }
   , email: {
       type: types.text
     , nullable: false
     }
   , selected: {
       type: types.bool
     , nullable: false
     , default: 'n'
     }
   };

   definition.indices = {};

   return definition;
 });
