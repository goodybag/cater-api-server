var assert  = require('assert');
var moment  = require('moment-timezone');
var utils   = require('../../utils');
var db      = require('../../db');

describe ('/orders - Shared orders', function(){
  before( function( done ){
    utils.test.loginAsUserId( 1, done );
  });

  after( function( done ){
    utils.test.logout( done );
  });

  // Hacky as shit
  var order;
  var restaurant_id = 31;

  it ('POST /orders', function( done ){
    this.expected = 12;

    var data = {
      restaurant_id: restaurant_id
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

  it ('POST /api/orders/:oid/generate_edit_token', function( done ){
    this.timeout( 5000 );
    this.expected = 10;

    var data = { };
    utils.test.json.post( ['/api/orders', order.id, 'generate_edit_token'].join('/'), data, function( error, res, body ){
      assert( !error, error);
      assert( !body.error, JSON.stringify( body.error, true, ' ' ) );
      assert( body.edit_token );
      order = body;
      done();
    });
  });

  it ('GET /restaurants/:rid/?edit_token=', function( done ){
    this.timeout( 5000 );
    this.expected = 400;

    utils.test.json.get( ['/restaurants', restaurant_id, '?edit_token=' + order.edit_token ].join('/'), function( error, res, body  ){
      assert( !error, error);
      assert( !body.error, JSON.stringify( body.error, true, ' ' ) );
      assert.equal( res.statusCode, 200 );
      done();
    });
  });

  it ('POST /orders/:oid/items - With edit token', function( done ){
    this.timeout( 5000 );
    this.expected = 10;

    var data = {
      item_id: 2106
    , quantity: 1
    , edit_token: order.edit_token
    };
    utils.test.json.post( ['/orders', order.id, 'items' ].join('/'), data, function( error, res, body ){
      assert( !error, error);
      assert( !body.error, JSON.stringify( body.error, true, ' ' ) );
      assert( body.id )
      done();
    });
  });

  it ('GET /api/orders/:oid/items', function( done ){
    this.timeout( 5000 );
    this.expected = 10;

    utils.test.json.get( ['/api/orders', order.id, 'items' ].join('/'), function( error, res, body  ){
      assert( !error, error);
      assert( !body.error, JSON.stringify( body.error, true, ' ' ) );
      assert( Array.isArray(body) );
      done();
    });
  });
});