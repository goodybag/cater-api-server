/**
 * Get restaurants
 * and filter dem boyz
 */

var utils           = require('../utils');
var errors          = require('../errors');
var db              = require('../db');

function format(res, $query, $options) {
  if ( res.locals.filters && res.locals.filters.region ) {
    var regions = utils.filter(res.locals.filters.region, function(option) {
      return option.active;
    });

    regions = utils.pluck(regions, 'name');
    if ( regions.length ) {
      utils.extend($query, {
        'regions.name': {
          $in: regions
        }
      });
    }
  }

  if ( res.locals.filters && res.locals.filters.show ) {
    var options = utils.filter(res.locals.filters.show, function(option) {
      return option.active;
    });

    options = utils.pluck(options, 'value');
    if ( options.length ) {
      utils.extend($query, {
        'is_hidden': {
          $in: options
        }
        ,'is_archived': false
      });
    }
  }

  if (res.locals.filters && res.locals.filters.sort ) {
    var sorts = utils.filter(res.locals.filters.sort, function(sort) {
      return sort.active;
    });

    sorts = utils.pluck(sorts, 'value');
    if ( sorts.length ) {
      sorts = sorts.map(function(sort) { return sort + ' asc'; });
      utils.extend($options, {
        order: sorts
      });
    }
  }
}

module.exports = function( options ){
  options = utils.defaults( options || {}, {
  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-GetRestaurants');

    var $query = {};

    var $options = {
      one:    []
    , many:   []
    , with:   []
    };

    // use plan.js
    format(res, $query, $options);

    db.restaurants.find($query, $options, function(err, restaurants){
      if(err) {
        logger.error('Error finding restaurants', err);
      }
      res.locals.restaurants = restaurants;
      next();
    });
  };
};
