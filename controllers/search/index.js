var utils = require('../../utils');
var config = require('../../config');
var models = require('../../models');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: config.isDev ? 'trace' : false
});

/**
 * GET /restaurants/search
 *
 */

module.exports.restaurant = function(req, res, next) {
  var name = req.query.name;

  client.search({
    index: 'restaurants'
  , type: 'restaurant'
  , body: {
      query: {
        match: {
          name: name
        }
      }
    }
  }, function(error, response) {
    if (error) return res.send(400, error);
    res.send(response);
  });

};



