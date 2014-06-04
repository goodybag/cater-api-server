var assert  = require('assert');
var utils   = require('../../utils');

describe ('/orders', function(){
  it ('GET /orders', function( done ){
    this.expected = 100;

    utils.test.loginAsUserId( 1, function( error ){
      assert( !error, error );

      utils.test.get( '/orders', function( error, res, body ){
        assert( !error, error );
        console.log(res);
        assert.equal( res.uri.pathname === '/orders', 'Incorrect pathname' );
        done();
      });
    });
  });

  it ('GET /orders/:oid', function( done ){
    this.expected = 84;

    utils.test.loginAsUserId( 1, function( error ){
      assert( !error, error );

      utils.test.get( '/orders', function( error ){
        assert( !error, error );
        done();
      });
    });
  });

  it ('PUT /orders/:oid', function( done ){
    this.expected = 104;

    utils.test.loginAsUserId( 1, function( error ){
      assert( !error, error );

      utils.test.get( '/orders', function( error ){
        assert( !error, error );
        done();
      });
    });
  });
});