var utils = require('../../utils');
var models = require('../../models');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

client.search({
  index: 'restaurants',
  q: 'name:dos'
}, function(err, response) {
  console.log(arguments);
});
