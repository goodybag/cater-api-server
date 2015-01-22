var assert      = require('assert');
var config      = require('../../../config');
var db          = require('../../../db');
var ybusinesses = require('stamps/yelp-business');

var allCuisines = [];

// Make sure we can inform the yelpbiz what `allCuisines` is
before(function( done ){
  db.cuisines.find( {}, { limit: 'all' }, function( error, cuisines ){
    if ( error ) done( error );

    allCuisines = cuisines.map( function( c ){ return c.name; });

    done();
  });
});

describe('Stamps', function(){
  describe('YelpBusiness', function(){
    describe.only('Coercions', function(){
      it('.categoriesToGbCuisines()', function(){
        var ybiz = ybusinesses.coercions.create({
          allCuisines: allCuisines
        });

        ybiz.categories = [ ['American (Traditional)', 'americanTraditional'] ];
        assert.deepEqual( ybiz.categoriesToGbCuisines(), ['American'] );

        ybiz.categories = [ ['Pizza', 'pizza'] ];
        assert.deepEqual( ybiz.categoriesToGbCuisines(), ['Pizza'] );
      });
    });
  });
});