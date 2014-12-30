process.env['GB_ENV'] = 'dev';

var assert  = require('assert');
var http    = require('http');
var app     = require('../../app');
var db      = require('../../db');
var utils   = require('../../utils');

var SERVER_URL = 'http://localhost:3000';

console.log();
console.log("**************! WARNING !**************");
console.log("** These tests require your DEV MOD  **");
console.log("** webserver to be running. See      **");
console.log("** comments for further explanation  **");
console.log("** Thank you for your understanding. **");
console.log("**************! goodbye !**************");
console.log();

// Why? Because we don't have a reliable test environment anymore
// We don't have gaurantees of fixture data and simply haven't
// kept up that environment. For now, it's just nicer for us to use
// data from prod-to-local.
// 
// We'll need to make these more robust later, but it's good that
// we have something anything
// 
// I understand we _could_ bootup the dev server here, but the output
// from the server mucks everything up so it's just easier to keep
// them separate for now.

describe('HTTP Server', function(){
  describe('Orders', function(){
    it( 'should be able to create an order without a user_id', function( done ){
      var data = {
        restaurant_id: 25
      };

      utils.post( SERVER_URL + '/orders', data, function( error, res, order ){
        assert.equal( error, null );
        assert.equal( typeof order, 'object' );
        assert.notEqual( order.id, null );
        assert.notEqual( order.id, undefined );
        assert( order.id > 0 );
        assert.equal( order.user_id, null );

        done();
      });
    });

    it( 'should create an order without a user_id and transfer them when registered', function( done ){
      this.timeout(4000);

      var data = {
        restaurant_id: 25
      };

      var udata = {
        email: 'test+' + utils.uuid() + '@goodybag.com'
      , password: 'password'
      };

      utils.post( SERVER_URL + '/orders', data, { jar: true }, function( error, res, order ){
        assert.equal( error, null );
        assert.equal( typeof order, 'object' );
        assert.notEqual( order.id, null );
        assert.notEqual( order.id, undefined );
        assert( order.id > 0 );
        assert.equal( order.user_id, null );

        utils.post( SERVER_URL + '/join', udata, { jar: true }, function( error ){
          assert.equal( error, null );

          db.users.findOne( {}, { order: 'id desc' }, function( error, user ){
            assert.equal( error, null );
            assert( !!user.id );

            setTimeout( db.orders.findOne.bind( db.orders, order.id, function( error, order ){
              assert.equal( error, null );
              assert.equal( order.user_id, user.id );
              done();
            }), 2000 );
          });
        });
      });
    });
  });
});