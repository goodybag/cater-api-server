var assert    = require('assert');
var config    = require('../../config');
var yelrp     = require('../../lib/yelp-restaurant-populator');

before( function( done ){
  // Just wait until db has probably returned with cuisines
  setTimeout( done, 50 );
});

describe ('Yelp Restaurant Populator (Yelrp)', function(){
  it ('coercions.categoriesToCuisines', function(){
    var result = yelrp.coercions.categoriesToCuisines({
      categories: [ ['American (Traditional)', 'americanTraditional'] ]
    });

    assert.deepEqual( result, { cuisines: ['American'] } );

    result = yelrp.coercions.categoriesToCuisines({
      categories: [ ['Pizza', 'pizza'] ]
    });

    assert.deepEqual( result, { cuisines: ['Pizza'] } );
  });
});