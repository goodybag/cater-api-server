var request = require('request');
var config = require('../../config');

var options = {
  uri: 'http://localhost:9200/cater/'
, method: 'DELETE'
, timeout: 7000
};
request(options, function(err, res, body) {
  if (err || body.error) {
    return console.log(err);
  }
  console.log('Deleting /cater');
  console.log('Response:', body);
});

options.uri = 'http://localhost:9200/_river/cater/';
request(options, function(err, res, body) {
  if (err) {
    return console.log(err);
  }
  console.log('Deleting /_river/cater');
  console.log('Response:', body);
});
