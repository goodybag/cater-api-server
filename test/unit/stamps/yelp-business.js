var assert      = require('assert');
var config      = require('../../../config');
var db          = require('../../../db');
var ybusinesses = require('stamps/yelp-business');

var allCuisines = [
  'American',
  'Asian Fusion',
  'Chinese',
  'Pizza',
  'Thai'
];

describe('Stamps', function(){
  describe('YelpBusiness', function(){
    describe('Fetch', function(){
      it('.fetch()', function( done ){
        var ybiz = ybusinesses.fetch.create({
          id: 'bamboo-bistro-austin'
        });

        ybiz.fetch( function( error ){
          assert( !error );

          assert( ybiz.name, "Bamboo Bistro" );

          done();
        });
      });
    });

    describe('Coercions', function(){
      it('.categoriesToGbCuisines()', function(){
        var ybiz = ybusinesses.coercions.create({
          allCuisines: allCuisines
        });

        ybiz.categories = [ ['American (Traditional)', 'americanTraditional'] ];
        assert.deepEqual( ybiz.categoriesToGbCuisines(), ['American'] );

        ybiz.categories = [ ['Pizza', 'pizza'] ];
        assert.deepEqual( ybiz.categoriesToGbCuisines(), ['Pizza'] );

        ybiz.categories = [ [ 'Chinese', 'chinese' ]
                          , [ 'Thai', 'thai' ]
                          , [ 'Asian Fusion', 'asianfusion' ]
                          ];
        assert.deepEqual( ybiz.categoriesToGbCuisines(), ['Chinese', 'Thai', 'Asian Fusion'] );
      });
    });
  });
});
