/**
 * Users Payment Methods Schema
 */

var dirac = require('dirac');
var types = require('../data-types');
var utils = require('../../utils');

var definition = module.exports;

definition.name = 'users_payment_methods';

definition.schema = {
  id: {
    type: types.serial
  , unique: true
  }
, created_at: {
    type: types.timestamptz
  , nullable: false
  , default: 'NOW()'
  }
, user_id: {
    type: types.int
  , nullable: false
  , references: {table: 'users', column: 'id', onDelete: 'cascade'}
  }
, payment_method_id: {
    type: types.int
  , references: {table: 'payment_methods', column: 'id', onDelete: 'cascade'}
  , nullable: false
  }
, name: {
    type: types.text
  , nullable: true
  }
};

definition.indices = {};

definition.extras = ['PRIMARY KEY ("user_id", "payment_method_id")'];

definition.create = function( userId, paymentMethod, callback ){
  var tx = dirac.tx.create();

  if ( 'data' in paymentMethod ){
    paymentMethod.data = JSON.stringify( paymentMethod.data );
  }

  utils.async.waterfall([
    ( next )=> tx.begin( ( error )=> next( error ) )
  , ( next )=> tx.payment_methods.insert( paymentMethod, { returning: ['*'] }, next )
  , ( pm, next )=>{
      var upm = {
        user_id: userId
      , payment_method_id: pm.id
      , name: paymentMethod.name
      };

      tx.users_payment_methods.insert( upm, ( error, result )=>{
        if ( error ){
          return next( error );
        }

        next( null, utils.extend( pm, result ) )
      });
    }
  , ( upm, next )=> tx.commit( error => next( error, upm ) )
  , ( upm, next )=> callback( null, upm )
  ], ( error )=>{
    if ( error ){
      return tx.rollback( ()=> callback( error ) )
    }
  });
};
