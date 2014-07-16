var assert      = require('assert');
var ordrin      = require('ordrin-api');
var config      = require('../../config');
var db          = require('../../db');
var ordrinUser  = require('../../lib/ordrin-user');

ordrin.api = new ordrin.APIs( config.ordrin.apiKeyPublic );

describe ('OrdrIn User Module', function(){
  it ( 'Should register a user with a user object', function( done ){
    db.users.insert( { email: 'bill@bob.com', password: 'poop' }, function( error, user ){
      assert( !error );

      ordrinUser.register( user, function( error, user ){
        assert( !error );

        assert.equal(
          user.ordrin_email
        , config.ordrin.emailFormat.replace( '{id}', user.id )
        );

        assert( !!user.orderin_password );

        ordrin.api.
      });
    });
  });

  it ( 'Should register a user with a userId' );
  it ( 'Should error because user already exists' );
  it ( 'Should update a users name' );
  it ( 'Should renew the users token' );
});