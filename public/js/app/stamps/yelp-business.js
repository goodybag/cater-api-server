/**
 * Yelp Business
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var config = require('config');

  return require('stampit')
    .stampit()
    .state({
      allCuisines: []
    , categories:  []
    })
    .methods({
      categoriesToGbCuisines: function(){
        return yelpBiz.categories.map( function( cat ){
          return config.yelrp.fromCatsToCuisines[ cat[ 0 ] ];
        }).filter( function( cuisine ){
          return [ null, undefined ].indexOf( cuisine ) === -1;
        }).filter( function( cuisine ){
          return cuisines.indexOf( cuisine ) > -1;
        }.bind ( this ))
      }
    });
});