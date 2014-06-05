var assert  = require('assert');
var moment  = require('moment-timezone');
var utils   = require('../../utils');
var db      = require('../../db');

describe ('/restaurants', function(){
  before( function( done ){
    utils.async.series([
      // Ensure no pending orders on restaurants
      db.orders.update.bind(
        db.orders
      , { user_id: 1, status: 'pending' }
      , { status: 'canceled' }
      )
    , utils.test.loginAsUserId.bind( null, 1 )

      // For the test that needs a pending order
    , utils.test.json.post.bind( null, '/orders', {
        restaurant_id:  111
      , datetime:       moment().add('days', 3).hour(13).format('YYYY-MM-DD hh:mm:ss')
      , guests:         25
      })
    ], done );
  });

  after( function( done ){
    utils.test.logout( done );
  });

  it ('GET /restaurants', function( done ){
    this.expected = 250;

    utils.test.get( '/restaurants', function( error, res, body ){
      assert( !error, error );
      assert.equal( res.request.uri.pathname, '/restaurants' );
      done();
    });
  });

  it ('GET /restaurants/34 - No pending order', function( done ){
    this.expected = 100;

    utils.test.get( '/restaurants/34', function( error, res, body ){
      assert( !error, error );
      assert.equal( res.request.uri.pathname, '/restaurants/34' );
      done();
    });
  });

  it ('GET /restaurants/111 - With pending order', function( done ){
    this.timeout(5000);
    this.expected = 3250;

    utils.test.get( '/restaurants/111', function( error, res, body ){
      assert( !error, error );
      assert.equal( res.request.uri.pathname, '/restaurants/111' );
      done();
    });
  });
});