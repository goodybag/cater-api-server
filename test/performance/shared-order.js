var assert  = require('assert');
var moment  = require('moment-timezone');
var utils   = require('../../utils');
var db      = require('../../db');


describe ('/orders - Shared orders guest user', function(){

  var fixture = {
    user: { id: 1 }
  , restaurant: { id: 31 }
  };

  var order;

  // provision new order for guest
  before( function( done ){
    utils.test.loginAsUserId( fixture.user.id, function( err ){
       var data = {
        restaurant_id: fixture.restaurant.id
      , guests: 25
      , datetime: moment().add(3, 'days').hour(13).format('YYYY-MM-DD hh:mm:ss')
      };

      utils.test.json.post( '/orders', data, function( error, res, body ){
        assert( !error, error );
        assert( !body.error, JSON.stringify( body.error, true, '  ' ) );

        order = body;

        utils.test.logout( done );
      });
       
    });
  });

  it('view shared menu', function(done) {
    console.log(order);
    setTimeout(done, 1000);
  });
});
describe ('/orders - Shared orders client user', function(){
  before( function( done ){
    utils.test.loginAsUserId( 1, done );
  });

  after( function( done ){
    utils.test.logout( done );
  });

  // Hacky as shit
  var order;
  var restaurant_id = 31;

  it ('create order', function( done ){
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

  it ('create edit_token', function( done ){
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

  it ('view shared order', function( done ){
    this.timeout( 5000 );
    this.expected = 400;

    utils.test.json.get( ['/restaurants', restaurant_id, '?edit_token=' + order.edit_token ].join('/'), function( error, res, body  ){
      assert( !error, error);
      assert( !body.error, JSON.stringify( body.error, true, ' ' ) );
      assert.equal( res.statusCode, 200 );
      done();
    });
  });

  it ('create shared order item', function( done ){
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

  it ('get shared order items', function( done ){
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
