var utils = require('../../utils');
var config = require('../../config');
var models = require('../../models');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
  host: config.bonsai.url || 'localhost:9200',
  log: config.isDev ? 'trace' : false
});

/**
 * GET /restaurants/search
 */

module.exports.restaurant = function(req, res, next) {
  var name = req.query.name;

  client.search({
    index: 'cater'
  , type: 'restaurant'
  , body: {
      query: {
        query_string: {
          query: name
        }
      }
    }
  }, function(error, response) {
    if (error) return res.send(400, error);
    var restaurants = utils.map(response.hits.hits, function(r) {
      return {
        id:         r._id
      , name:       r._source.name
      , logo_url:   r._source.logo_url
      };
    });
    res.send(restaurants);
  });

};
