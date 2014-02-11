var utils = require('../../utils');
var models = require('../../models');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

/**
 * GET /restaurants/search
 *
 */

module.exports.restaurant = function(req, res, next) {
  var name = req.query.name;

  client.search({
    index: 'restaurants'
  , q: 'name:' + name
  }, function(error, response) {
    if (error) res.send(400, error);
    res.send(response);
  });
};



