var assert      = require('assert');
var ordrin      = require('ordrin-api');
var config      = require('../../config').getEnv('test');
var db          = require('../../db');
var utils       = require('../../utils');
var tutils      = require('../../lib/test-utils');
var ordrinUser  = require('../../lib/ordrin-user');

ordrin.api = new ordrin.APIs( config.ordrin.apiKeyPublic );
describe ('OrdrIn User Module', function(){
  it ( 'Should register a user with a user object', function( done ){
    tutils.generateUser( function( error, user ){
      assert( !error );

      ordrinUser.register( user, function( error, user ){
        console.log(error);
        assert( !error );

        assert.equal(
          user.ordrin_email
        , config.ordrin.emailFormat.replace( '{id}', user.id )
        );

        assert( !!user.orderin_password );

        var creds = {
          email:            user.orderin_email
        , current_password: user.orderin_password
        };

        ordrin.api.get_account_information( creds, function( error, result ){
          assert( !error );

          console.log(result);
          done();
        });
      });
    });
  });

  it ( 'Should register a user with a userId' );
  it ( 'Should error because user already exists' );
  it ( 'Should update a users name' );
  it ( 'Should renew the users token' );
});