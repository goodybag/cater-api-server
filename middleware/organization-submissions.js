/**
 * This middleware queries organizations that have submitted orders
 */
var db = require('db');
var builder = require('mongo-sql');

var OrganizationSubmitted = function(options){
  return function(req, res, next){
    var logger = req.logger.create('OrganizationSubmissions');
    var query = {
      type:     'select'
    , columns: ['created_at', 'email', 'organization', 'status', 'submitted_rank']
    , table: {
        type: 'select'
      , table: 'orders'
      , columns: [
          { expression: 'order_statuses.created_at at time zone orders.timezone' }
        , 'users.email'
        , 'users.organization'
        , 'order_statuses.status'
        , { expression: 'rank() over (partition by users.organization order by order_statuses.created_at desc) submitted_rank' }
        ]
      , join: [
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

    db.query2(query, function(err, results) {
      if ( err ) {
        console.error(err);
        logger.error('Unable to get organization submissions', err);
        res.send(500);
      }
      console.log(results);
      next();
    })

  };
}

module.exports = OrganizationSubmitted;
