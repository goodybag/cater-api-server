var config = require('../config');
var utils = require('../utils');
var Models = require('../models');
var hbHelpers = require('../public/js/lib/hb-helpers');


// select restaurant_id, count(*) as orders_count from orders where status='accepted' group by restaurant_id order by orders_count desc;
module.exports.revenueByRestaurant = function (req, res) {

  var query = {
    with: [
      {
        name: 'orders_per_restaurant'
      , type: 'select'
      , table: 'orders'
      , columns: ['restaurant_id', { type: 'function', function: 'count', expression: '*', alias: 'orders_count' }]
      , groupBy: ['restaurant_id']
      , where: { status: 'accepted' }
      }
    ]
  , columns: ['*', {table: 'orders_per_restaurant', name:'orders_count', alias: 'orders_count'}]
  , joins: {
      orders_per_restaurant: {
        type: 'left'
      , on: { restaurant_id: '$orders.restaurant_id$' }
      }
    }
  , order: ['orders_per_restaurant.orders_count desc nulls last', 'restaurant_id']
  , distinct: [ 'orders_per_restaurant.orders_count', 'restaurant_id']
  };


  Models.Order.find( query, function(error, results) {
    if (error) return res.json(error);

    res.render('analytics/revenue-per-restaurant', {results: utils.invoke(results, 'toJSON')});
  });
};

module.exports.list = function( req, res ){
  function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(+d);
    d.setHours(0,0,0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(),0,1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
    // Return array of year and week number
    return weekNo;
  }

  var $query = {
    where: {
      status: 'accepted'
    }
  , limit: 'all'
  };

  Models.Order.find( $query, function( error, results ){
    if ( error ) return res.json( error );

    utils.async.parallel(
      results.map( function( order ){
        return order.getOrderItems.bind( order )
      }).concat( results.map( function( order ){
        return order.getRestaurant.bind( order );
      }))

    , function( error ){
        if ( error ) return res.json( error );

        results = results.map( function( r ){
          r = r.toJSON();
          var d = new Date( r.created_at );
          r.week_number = getWeekNumber( d );
          r.year_number = d.getFullYear();
          return r;
        });

        var start = { year: 2013, week: 40 };
        var curr = { year: 2013, week: 40 };
        var d = new Date();
        var now = { year: d.getFullYear(), week: getWeekNumber( d ) };
        var ordersByWeek = [];
        var result;
        var stop = false;

        while ( !stop ){
          result = results.filter( function( r ){
            return r.year_number === curr.year && r.week_number === curr.week;
          });

          ordersByWeek.push({
            period: [ curr.year, 'Week', curr.week ].join(' ')
          , numberOfOrders: result.length
          , periodTotal: result.length === 0 ? 0 : parseFloat( result.reduce( function( a, b ){
              return parseFloat(!(typeof a === 'object') ? (a || 0) : hbHelpers.total(
                a.sub_total, a.restaurant.delivery_fee, a.tip
              )) + parseFloat( hbHelpers.total(
                b.sub_total, b.restaurant.delivery_fee, b.tip
              ) );
            }).toFixed(2) )
          , uniqueUsers:  utils.unique( result, function( r ){
                            return r.user_id
                          }).length
          })

          curr.week++;
          if ( curr.week === 53 ){
            curr.week = 1;
            curr.year++;
          }

          if ( curr.year === now.year ){
            if ( curr.week === now.week + 1 ) stop = true;
          }
        }

        results.sort( function( a, b ){
          return a.id > b.id;
        });

        res.render( 'analytics', {
          orders:             results
        , ordersByWeek:       ordersByWeek
        , overallTotal:       parseFloat( ordersByWeek.map( function( o ){
                                return o.periodTotal
                              }).reduce( function( a, b ){
                                return ( a || 0 ) + b;
                              }).toFixed(2) )
        , overallUniqueUsers: utils.unique( results, function( r ){
                                return r.user_id;
                              }).length
        });
      }
    );
  });
};