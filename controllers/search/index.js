var utils = require('../../utils');
var config = require('../../config');
var models = require('../../models');
var elastic = require('../../lib/elastic');

/**
 * GET /restaurants/search?name=
 */
module.exports.restaurant = function(req, res, next) {
  var name = req.query.name;

  var $query = {
    query: {
      query_string: {
        query: name
      }
    }
  };

  elastic.search('restaurant', $query, function(error, response) {
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