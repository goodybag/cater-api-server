var qs = require('querystring');
var utils = require('../utils');

/* Examines req.query and attaches req.locals.searchTags with
   removable querystrings.

   Example:
   www.goodybag.com/restaurants?cuisines=Japanese&cuisines=BBQ&sort=price
   req.locals.searchTags = [
     { title: 'Japanese', qs: 'cuisines=BBQ&sort=price' }
   , { title: 'BBQ', qs:'cuisines=Japanese&sort=price' }
   , { title: 'sort: price', qs: 'cuisines=Japanese&cuisines=BBQ&sort' }
   ]
*/
module.exports = function(opts) {
  return function searchTags(req, res, next) {
    var searchTags = utils.pick(req.query, 'sort', 'cuisines', 'diets', 'mealTypes', 'search');

    res.locals.searchTags = Object.keys(searchTags).reduce(function(list, param) {
      // Multiple value queries
      if( Array.isArray(req.query[param]) ) {
        req.query[param].forEach(function(p) {
          var copy = utils.extend({}, req.query);
          copy[param] = utils.without(copy[param], p);
          list.push({ text: p, qs: utils.queryParams(copy, true) });
        });
      } else {
        list.push({
          text: param + ': '+req.query[param]
        , qs: utils.queryParams(utils.omit(req.query, param))
        });
      }
      return list;
    }, []);

    next();
  };
};
