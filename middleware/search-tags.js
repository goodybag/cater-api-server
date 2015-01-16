var qs = require('querystring');
var utils = require('../utils');

module.exports = function(opts) {

  return function searchTags(req, res, next) {
    var searchTags = utils.pick(req.query, 'sort', 'cuisines', 'search');
    res.locals.searchTags = Object.keys(searchTags).reduce(function(list, param) {
      // Multiple value queries
      if( Array.isArray(req.query[param]) ) {
        req.query[param].forEach(function(p) {
          var copy = utils.extend({}, req.query);
          copy[param] = utils.without(copy[param], p);
          list.push({ text: p, qs: qs.stringify(copy) });
        });
      } else {
        list.push({
          text: param + ': '+req.query[param]
        , qs: qs.stringify(utils.without(req.query, 'search'))
        });
      }
      return list;
    }, []);

    next();
  };
};
