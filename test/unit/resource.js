var assert    = require('assert');
var moment    = require('moment-timezone');
var config    = require('../../config');
var resource  = require('../../public/js/lib/resource');

describe ('Resource', function(){
  it ('resource( string )', function(){
    var url = 'http://localhost:8000/api';
    var api = resource( url );
    assert.equal( api.url, url );
  });

  it ('resource( object )', function(){
    var url = 'http://localhost:8000/api';
    var api = resource({ url: url });
    assert.equal( api.url, url );
  });

  it ('resource( string )( string )( string )( string )', function(){
    var a = resource()('/users')(27);
    assert.equal( a.url, '/users/27');
    assert.equal( a('addresses').url, '/users/27/addresses' );
    assert.equal( a.url, '/users/27');
  });

  it ('resource( string )( string, { sub_resources } )', function(){
    var api = resource('api');
    var users = api( 'users', {
      addresses: 'addresses'
    });

    assert.equal( api.url, 'api' );
    assert.equal( users.url, 'api/users' );
    assert.equal( users(27).addresses.url, 'api/users/27/addresses' );
    assert.equal( users.url, 'api/users' );
    assert.equal( users(27).addresses.url, 'api/users/27/addresses' );
    assert.equal( users(27).addresses.getUrl(), 'api/users/27/addresses' );
  });
});