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

  return require('stampit')()
    .state({
      allCuisines: []
    , categories:  []
    })
    .methods({
      categoriesToGbCuisines: function(){
        return this.categories.map( function( cat ){
          return config.yelrp.fromCatsToCuisines[ cat[ 0 ] ] || cat[ 0 ];
        }).filter( function( cuisine ){
          return this.allCuisines.indexOf( cuisine ) > -1;
        }.bind( this ));
      }
    });
});