var request = require('request');
var config = require('../../config');

var options = {
  uri: 'http://localhost:9200/_river/restaurants/_meta'
, method: 'PUT'
, timeout: 7000
, json: {
    type: 'jdbc'
  , jdbc: {
      url: 'jdbc:' + config.postgresConnStr.replace('postgres', 'postgresql')
    , sql: 'select id, name from restaurants'
    , index: 'restaurants'
    , type: 'restaurant'
    }
  }
};

request(options, function(err, res, body) {
  if (err) {
    return console.log(err);
  }
  console.log('Created /_river/restaurants');
});