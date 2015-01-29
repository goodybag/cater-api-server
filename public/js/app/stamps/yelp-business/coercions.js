/**
 * YelpBusiness.Coercions
 * Provides to coerce Yelp data to goodybag data
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var config = require('config');

  var fromCatsToCuisines = {
    "American (Traditional)": "American"
  , "American (New)": "American"
  };

  // For values not explicitly set, there's a 1-to-1 mapping
  config.yelp.yelpCategories.forEach( function( cat ){
    // Don't override existing values
    if ( fromCatsToCuisines[ cat ] ) return;

    fromCatsToCuisines[ cat ] = cat;
  });

  return require('stampit')()
    .state({
      allCuisines: []
    , categories:  []
    })
    .methods({
      categoriesToGbCuisines: function(){
        return this.categories.map( function( cat ){
          return fromCatsToCuisines[ cat[ 0 ] ] || cat[ 0 ];
        }).filter( function( cuisine ){
          return this.allCuisines.indexOf( cuisine ) > -1;
        }.bind( this ));
      }
    });
});