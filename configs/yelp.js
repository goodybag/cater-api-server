/**
 * Config.yelp
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

, businessBaseUrl: 'http://www.yelp.com/biz'
, token: 'p2aFEzA20-W4kFttJqiATW3fyq7AUyW6'
, tokenSecret: 'gik4eZYy1PB8Fna4TMqIauXUGKs'
, consumerKey: '6F-LMALFlGTckzlBfg03fA'
, consumerSecret: 'OmclTS9gpl03vksQvA_Cr7OUPU4'
, apiUrl: 'http://api.yelp.com/v1'

, concernedFields: [
    'url'
  , 'review_count'
  , 'rating'
  , 'rating_img_url'
  , 'rating_img_url_small'
  , 'rating_img_url_large'
  , 'reviews'
  ]
, reviewThreshold: 3
};