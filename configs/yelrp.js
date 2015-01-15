/**
 * Config.yelrp
 */

module.exports = {
  yelpCategories: [ "Cajun/Creole", "Restaurants", "American (Traditional)"
                  , "Seafood", "Food", "Nightlife", "Bars", "American (New)"
                  , "Breakfast & Brunch", "Sandwiches", "Fast Food"
                  , "Steakhouses", "Barbeque", "Sports Bars", "Mexican"
                  , "Sushi Bars", "Tex-Mex", "Event Planning & Services"
                  , "Pizza", "Food Trucks", "Southern", "Specialty Food"
                  , "Cafes", "Japanese", "Caterers", "Food Stands", "Pubs"
                  , "Seafood Markets", "Burgers", "Chicken Wings"
                  ]

, fromCatsToTags: {
    "American (Traditional)": "American"
  , "American (New)": "American"
  }
};

// For values not explicitly set, there's a 1-to-1 mapping
module.exports.yelpCategories.forEach( function( cat ){
  // Don't override existing values
  if ( module.exports.fromCatsToTags[ cat ] ) return;

  module.exports.fromCatsToTags[ cat ] = cat;
});