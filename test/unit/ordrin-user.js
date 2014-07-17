var assert      = require('assert');
var ordrin      = require('ordrin-api');
var config      = require('../../config').getEnv('test');
var db          = require('../../db');
var utils       = require('../../utils');
var tutils      = require('../../lib/test-utils');
var ordrinUser  = require('../../lib/ordrin-user');

ordrin = new ordrin.APIs( config.ordrin.apiKeyPrivate );

describe ('OrdrIn User Module', function(){
  it ( 'Should register a user with a user object', function( done ){
    tutils.generateUser( function( error, user ){
      assert( !error );

      ordrinUser.register( user, function( error, user ){
        assert( !error );

        assert.equal(
          user.ordrin_email
        , config.ordrin.emailFormat.replace( '{id}', user.id )
        );

        assert( !!user.ordrin_password );

        var creds = {
          email:            user.ordrin_email
        , current_password: user.ordrin_password
        };

        ordrin.get_account_info( creds, function( error, result ){
          assert( !error );

          assert.equal( user.ordrin_email, result.em );

          done();
        });
      });
    });
  });

  it ( 'Should register a user with a userId', function( done ){
    tutils.generateUser( function( error, user ){
      assert( !error );

      ordrinUser.register( user.id, function( error, user ){
        assert( !error );

        assert.equal(
          user.ordrin_email
        , config.ordrin.emailFormat.replace( '{id}', user.id )
        );

        assert( !!user.ordrin_password );

        var creds = {
          email:            user.ordrin_email
        , current_password: user.ordrin_password
        };

        ordrin.get_account_info( creds, function( error, result ){
          assert( !error );

          assert.equal( user.ordrin_email, result.em );

          done();
        });
      });
    });
  });

  it ( 'Should error because user already exists', function( done ){
    tutils.generateUser( function( error, user ){
      assert( !error );

      ordrinUser.register( user, function( error, user ){
        assert( !error );

        assert.equal(
          user.ordrin_email
        , config.ordrin.emailFormat.replace( '{id}', user.id )
        );

        assert( !!user.ordrin_password );

        var creds = {
          email:            user.ordrin_email
        , current_password: user.ordrin_password
        };

        ordrin.get_account_info( creds, function( error, result ){
          assert( !error );

          assert.equal( user.ordrin_email, result.em );

          ordrinUser.register( user, function( error, user ){
            assert( !!error );
            done();
          });
        });
      });
    });
  });

  it ( 'Should renew the users token', function( done ){
    tutils.generateUser( function( error, user ){
      assert( !error );

      ordrinUser.register( user, function( error, user ){
        assert( !error );

        assert.equal(
          user.ordrin_email
        , config.ordrin.emailFormat.replace( '{id}', user.id )
        );

        assert( !!user.ordrin_password );

        var creds = {
          email:            user.ordrin_email
        , current_password: user.ordrin_password
        };

        ordrin.get_account_info( creds, function( error, result ){
          assert( !error );

          assert.equal( user.ordrin_email, result.em );

          ordrinUser.renewToken( user.id, function( error, token ){
            assert( !error );
            assert( !!token );
            done();
          });
        });
      });
    });
  });
});