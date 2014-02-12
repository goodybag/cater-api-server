var request = require('request');
var config = require('../../config');

var options = {
  uri: 'http://localhost:9200/restaurants/'
, method: 'DELETE'
, timeout: 7000
};
request(options, function(err, res, body) {
  if (err) {
    return console.log(err);
  }
  console.log('Deleted /restaurants');
});

options.uri = 'http://localhost:9200/_river/restaurants/';
request(options, function(err, res, body) {
  if (err) {
    return console.log(err);
  }
  console.log('Deleted /_river/restaurants');
});
