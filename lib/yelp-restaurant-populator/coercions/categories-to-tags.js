/**
 * Categories->Tags
 * Takes yelp categories and turns them into our Tags
 */

var config = require('../../../config');

module.exports = function( yelpBiz ){
  return {
    tags: yelpBiz.categories.map( function( cat ){
            return config.yelrp.fromCatsToTags[ cat[ 0 ] ];
          }).filter( function( tag ){
            return [ null, undefined ].indexOf( tag ) === -1;
          })
  };
};