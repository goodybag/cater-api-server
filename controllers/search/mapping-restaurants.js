var request = require('request');

var options = {
  uri: 'http://localhost:9200/cater/'
, method: 'PUT'
, timeout: 7000
, json: {
    mappings: {
      restaurant: {
        properties: {
          id: {type: 'integer'}
        , name: {
            type:         'string'
          , analyzer:     'snowball'
          }
        }
      }
    }
  }
};

request(options, function(err, res, body) {
  if (err) {
    return console.log(err);
  }
  console.log('Creating /cater/restaurant mapping');
  console.log('Response:', body);
});