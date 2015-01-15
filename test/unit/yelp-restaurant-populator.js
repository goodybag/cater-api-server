var assert    = require('assert');
var config    = require('../../config');
var yelrp     = require('../../lib/yelp-restaurant-populator');

describe ('Yelp Restaurant Populator (Yelrp)', function(){
  it ('coercions.categoriesToTags', function(){
    var result = yelrp.coercions.categoriesToTags({
      categories: [ ['American (Traditional)', 'americanTraditional'] ]
    });

    assert.deepEqual( result, { tags: ['American'] } );

    result = yelrp.coercions.categoriesToTags({
      categories: [ ['Pizza', 'pizza'] ]
    });

    assert.deepEqual( result, { tags: ['Pizza'] } );
  });
});