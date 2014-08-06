var assert    = require('assert');
var helpers = require('../../public/js/lib/hb-helpers');

describe ('Handlebars Helpers', function(){
  it ('should convert pennies to dollars', function(){
    assert.equal(helpers.dollars(2623.5), '26.24');
    assert.equal(helpers.dollars(100.5), '1.01');
    assert.equal(helpers.dollars(55117.5), '551.18');
  });

  it('queryParams - Should convert a single object', function(){
    var result = helpers.queryParams({ a: 1, b: 'yay' });

    assert.equal( result[0], '?' );
    assert.equal( result.match(/\&/g).length, 1 );

    assert( result.indexOf('a=1') > -1 );
    assert( result.indexOf('b=yay') > -1 );
  });

  it('queryParams - Should convert a single object and additional params', function(){
    var result = helpers.queryParams({ a: 1, b: 'yay' }, 'c', 7, 'd', 'poop');

    assert.equal( result[0], '?' );
    assert.equal( result.match(/\&/g).length, 3 );

    assert( result.indexOf('a=1') > -1 );
    assert( result.indexOf('b=yay') > -1 );
    assert( result.indexOf('c=7') > -1 );
    assert( result.indexOf('d=poop') > -1 );
  });
});