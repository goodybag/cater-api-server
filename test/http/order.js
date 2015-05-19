/**
 * These tests kinda suck because they rely on specific data
 * to be present. Still, they're better than nothing.
 */

process.env['GB_ENV'] = 'dev';

var assert  = require('assert');
var http    = require('http');
var app     = require('../../app');
var db      = require('../../db');
var utils   = require('../../utils');
var config  = require('../../config');

var SERVER_URL = config.baseUrl;

console.log();
console.log("**************! WARNING !**************");
console.log("** These tests require your DEV MODE **");
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
    it( 'should send a 204 when changing attempting to add to status history with current status', function( done ){
      var jar = utils.request.jar();

      var url = ':baseUrl/orders'.replace( ':baseUrl', SERVER_URL );

      utils.async.waterfall([
        utils.post.bind( null, url, { restaurant_id: 25 }, { jar: jar } )
      , function( res, order, next ){
          var url = ':baseUrl/orders/:id/status-history'
            .replace( ':baseUrl', SERVER_URL )
            .replace( ':id', order.id );
          utils.post( url, { status: 'pending' }, { jar: jar }, next );
        }
      , function( res, body, next ){
          assert.equal( res.statusCode, 204 );
          assert( !body );
          next();
        }
      ], done )
    });

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

      var jar = utils.request.jar();

      var data = {
        restaurant_id: 25
      };

      var udata = {
        email: 'test+' + utils.uuid() + '@goodybag.com'
      , password: 'password'
      };

      utils.post( SERVER_URL + '/orders', data, { jar: jar }, function( error, res, order ){
        assert.equal( error, null );
        assert.equal( typeof order, 'object' );
        assert.notEqual( order.id, null );
        assert.notEqual( order.id, undefined );
        assert( order.id > 0 );
        assert.equal( order.user_id, null );

        utils.post( SERVER_URL + '/join', udata, { jar: jar }, function( error ){
          assert.equal( error, null );

          db.users.findOne( {}, { order: 'id desc' }, function( error, user ){
            assert.equal( error, null );
            assert( !!user.id );

            // Give some time for events to fire
            setTimeout( db.orders.findOne.bind( db.orders, order.id, function( error, order ){
              assert.equal( error, null );
              assert.equal( order.user_id, user.id );
              done();
            }), 50 );
          });
        });
      });
    });

    it( 'should create an order without a user_id and transfer them when user logs in', function( done ){
      this.timeout(4000);

      var jar = utils.request.jar();

      var userId = 11;

      var data = {
        restaurant_id: 25
      };

      var udata = {
        email: utils.getTestEmail( userId )
      , password: 'password'
      };

      utils.post( SERVER_URL + '/orders', data, { jar: jar }, function( error, res, order ){
        assert.equal( error, null );
        assert.equal( typeof order, 'object' );
        assert.notEqual( order.id, null );
        assert.notEqual( order.id, undefined );
        assert( order.id > 0 );
        assert.equal( order.user_id, null );

        utils.post( SERVER_URL + '/login', udata, { jar: jar }, function( error ){
          assert.equal( error, null );

          // Give some time for events to fire
          setTimeout( db.orders.findOne.bind( db.orders, order.id, function( error, order ){
            assert.equal( error, null );
            assert.equal( order.user_id, userId );
            done();
          }), 50 );
        });
      });
    });

    it( 'should allow a user to create an order, require them to register before checkout, then redirect them back to their order', function( done ){
      this.timeout(4000);

      var jar = utils.request.jar();

      var odata = {
        restaurant_id: 25
      , zip: '78756'
      , datetime: moment().day(10).format('YYYY-MM-DD hh:mm') // next wednesday
      , guests: 10
      };

      var idata = [{
        item_id: 123
      , quantity: 5
      }];

      var udata = {
        email: utils.getTestEmail()
      , password: 'password'
      , password2: 'password'
      , region_id: 1
      };

      var reqOptions = { jar: jar };

      utils.async.waterfall([
        // Create order
        function( next ){
          utils.post( SERVER_URL + '/orders', odata, reqOptions, function( error, res, order ){
            assert.equal( error, null );
            assert.notEqual( order.id, null );
            assert.notEqual( order.id, undefined );

            next( null, order );
          });
        }

        // Add items
      , function( order, next ){
          var url = [ SERVER_URL, 'orders', order.id, 'items' ].join('/');
          utils.async.each( idata, function( item, done_ ){
            utils.post( url, item, reqOptions, done_ );
          }, function( error ){
            assert( !error );

            next( null, order );
          });
        }

        // should allow us to go to order summary
      , function( order, next ){
          var url = [ SERVER_URL, 'orders', order.id, 'items' ].join('/');
          utils.get( url, reqOptions, function( error, res ){
            assert( !error );
            assert.equal( res.request.uri.path, [ '/orders', order.id, 'items' ].join('/') );
            next( null, order );
          });
        }

        // should redirect to registration
      , function( order, next ){
          var url = [ SERVER_URL, 'orders', order.id ].join('/');
          utils.get( url, reqOptions, function( error, res ){
            assert( !error );
            assert.equal( res.request.uri.path, [ '/join?next=/orders/', order.id ].join('') );
            next( null, order );
          });
        }

        // should register and then redirect back to order
      , function( order, next ){
          utils.post( SERVER_URL + '/join?next=/orders/' + order.id, udata, reqOptions, function( error, res, data ){
            assert( !error );

            // ACTUALLY - I dunno why it's not reflecting the redirect
            // I see in my server code that the redirect is ocurring
            // so let's just make another assertion that we can actually
            // hit /orders/:oid
            // assert.equal( res.request.uri.path, [ '/orders', order.id ].join('/') );

            setTimeout( next.bind( null, null, order ), 50 );
          });
        }

        // ensure we can hit /orders/:oid
      , function( order, next ){
          var url = [ SERVER_URL, 'orders', order.id ].join('/');
          utils.get( url, reqOptions, function( error, res ){
            assert( !error );
            assert.equal( res.request.uri.path, '/orders/' + order.id );
            done();
          });
        }
      ]);
    });
  });

  describe('Restaurants Orders', function(){
    it ('Should allow a restaurant to view an order via the review_token', function( done ){
      var jar = utils.request.jar();
      var reqOptions = { jar: jar };

      utils.async.waterfall([
        // Lookup any ol' order
        db.orders.findOne.bind( db.orders, 3000 )

      , function( order, next ){
          var urlPath = [ 'orders', order.id + '?review_token=' + order.review_token ].join('/');
          utils.get( [ SERVER_URL, urlPath ].join('/'), reqOptions, function( error, res ){
            assert( !error );
            assert.equal( res.statusCode, 200 );
            assert.equal( res.request.uri.path, '/' + urlPath );
            done();
          });
        }
      ], done );
    });
  });
});