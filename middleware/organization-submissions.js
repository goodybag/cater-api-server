/**
 * This middleware queries organizations that have submitted orders
 */
var db = require('../db');
var builder = require('mongo-sql');
var utils = require('../utils');

var withQuery = function(orderBy, filters) {
  var query = {
    type:     'select'
  , columns: ['created_at', 'email', 'user_id', 'user_name', 'organization', 'status', 'submitted_rank']
  , table: {
      type: 'select'
    , table: 'orders'
    , columns: [
        { expression: 'order_statuses.created_at at time zone orders.timezone', alias: 'created_at' }
      , 'users.email'
      , 'users.organization'
      , { expression: 'users.id', alias: 'user_id' }
      , { expression: 'users.name', alias: 'user_name' }
      , 'order_statuses.status'
      , { expression: 'rank() over (partition by users.organization order by order_statuses.created_at ' + orderBy + ') submitted_rank' }
      ]
    , joins: [
        { type: 'left'
        , target: "order_statuses"
        , on: { order_id: '$orders.id$' }
        },

        { type: 'left'
        , target: 'users'
        , on: { id: '$orders.user_id$' }
        }
      ]
    , where: {
        'order_statuses.status': 'submitted'
      , 'orders.status': 'accepted'
      }
    , alias: 'foo'
    }
  , where: { 'submitted_rank': 1 }
  };

  var regions = utils.filter(filters.region, function(option) {
    return option.active;
  });
  regions = utils.pluck(regions, 'name');
  if ( regions.length ){
    query.table.joins.push({ type: 'left', target: 'restaurants', on: { id: '$orders.restaurant_id$' } });
    query.table.joins.push({ type: 'left', target: 'regions', on: { id: '$restaurants.region_id$' } })
    query.table.where['regions.name'] = { '$in': regions };
  }

  return query;
};

var OrganizationSubmitted = function(options){
  return function(req, res, next){
    var logger = req.logger.create('OrganizationSubmissions');
    var query = {
      type: 'select'
    , table: 'last_submitted'
    , columns: [
        { expression: 'first_submitted.created_at', alias: 'first_submitted' }
      , { expression: 'last_submitted.created_at', alias: 'last_submitted' }
      , { expression: 'extract(month from now()) + (12 * extract(year from now())) - extract(month from last_submitted.created_at) - (12 * extract(year from last_submitted.created_at))', alias: 'months_since_last_submitted' }
      , 'organization'
      , 'email'
      , 'user_id'
      , 'user_name'
      ]
    , with: {
        last_submitted: withQuery('desc', req.filters)
      , first_submitted: withQuery('asc', req.filters)
      }
    , joins: [
        {
          type: 'left'
        , target: 'first_submitted'
        , on: { 'organization' : '$last_submitted.organization$' }
        }
      ]
    };

    db.query2(query, function(err, results) {
      if ( err ) {
        logger.error('Unable to get organization submissions', err);
        return res.send(500);
      }

      req.organization_submissions = res.locals.organization_submissions = results;
      return next();
    });
  };
};

module.exports = OrganizationSubmitted;
