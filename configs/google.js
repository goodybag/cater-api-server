/**
 * Config.Google
 */

module.exports = {
  apiKey: 'AIzaSyBbsgtm6Tqdh3ZyWfRj2Mg_eSZDW8ajLss'

, mapsEmbedURL: 'https://www.google.com/maps/embed/v1/place'
, directionsEmbedURL: 'https://www.google.com/maps/embed/v1/directions'

, adwords: {
    conversionId: 973544387
  }

, analytics: 'UA-23372459-4'

, geocoding: {
    limit: { daily: 2500, second: 5 }
  , url: 'https://maps.googleapis.com/maps/api/geocode/json'
  }
  
, directions: {
    limit: { daily: 10000, second: 2 }
  }
  
, distanceMatrix: {
    limit: { daily: 2500, second: 1000 }
  , url: 'https://maps.googleapis.com/maps/api/distancematrix/json'
  }

, places: {
    limit: { daily: 150000 }
  }
};

if ( process.env['GB_ENV'] === 'production' ){
  module.exports.analytics = 'UA-23372459-3';
}