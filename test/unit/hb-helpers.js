var assert    = require('assert');
var helpers = require('../../public/js/lib/hb-helpers');

describe ('Handlebars Helpers', function(){
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

  it('formatDietTag - should map diet tags to display text', function() {
    var results = ['glutenFree', 'vegan', 'dairyFree'].map(helpers.formatDietTag);
    assert.deepEqual( results, ['Gluten-Free', 'Vegan', 'Dairy-Free']);
  });

  it('formatDietTag - should just return non diet tags', function() {
    var results = ['glutenFree', 'vegan', 'dairyFree', 'THIS SHOULD BE THE SAME'].map(helpers.formatDietTag);
    assert.deepEqual( results, ['Gluten-Free', 'Vegan', 'Dairy-Free', 'THIS SHOULD BE THE SAME']);
  })
});
