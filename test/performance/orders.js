var assert  = require('assert');
var moment  = require('moment-timezone');
var utils   = require('../../utils');
var db      = require('../../db');

describe ('/orders', function(){
  before( function( done ){
    utils.test.loginAsUserId( 1, done );
  });

  after( function( done ){
    utils.test.logout( done );
  });

  it ('GET /orders', function( done ){
    this.expected = 1380;

    utils.test.get( '/orders', function( error, res, body ){
      assert( !error, error );
      assert.equal( res.request.uri.pathname, '/orders' );
      done();
    });
  });

  it ('GET /orders/1662', function( done ){
    this.expected = 1404;

    utils.test.get( '/orders/1662', function( error, res, body ){
      assert( !error, error );
      assert.equal( res.request.uri.pathname, '/orders/1662' );
      done();
    });
  });

  it ('GET /orders/1000/manifest', function( done ){
    this.expected = 1430;

    utils.test.get( '/orders/1000/manifest', function( error, res, body ){
      assert( !error, error );
      assert.equal( res.request.uri.pathname, '/orders/1000/manifest' );
      done();
    });
  });

  // Hacky as shit
  var order;
  it ('POST /orders', function( done ){
    this.expected = 12;

    var data = {
      restaurant_id: 31
    , guests: 25
    , datetime: moment().add('days', 3).hour(13).format('YYYY-MM-DD hh:mm:ss')
    };

    utils.test.json.post( '/orders', data, function( error, res, body ){
      assert( !error, error );
      assert( !body.error, JSON.stringify( body.error, true, '  ' ) );

      order = body;

      done();
    });
  });

  it ('POST /order/:oid/items', function( done ){
    this.timeout( 5000 );
    this.expected = 13;

    assert( !!order.id, 'Order was not monkey-patched' );

    var data = {
      item_id: 2106
    , quantity: 1
    };

    utils.test.json.post( [ '/orders', order.id, 'items' ].join('/'), data, function( error, res, body ){
      assert( !error, error );
      assert( !body.error, JSON.stringify( body.error, true, '  ' ) );

      done();
    });
  });
});