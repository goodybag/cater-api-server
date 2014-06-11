var config = require('../config');
var utils = require('../utils');
var db = require('../db');

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

  /**
   * Calculates total per period
   *
   * @param {array} result
   */
  function calcPeriodTotal( result ){
    if ( !result.length ){
      return 0;
    }

    // Sum order totals per period
    var periodTotal = result.reduce( function( memo, curr ) {
      return memo + (curr.total / 100);
    }, 0);

    // Round to two decimal places
    return parseFloat( periodTotal ).toFixed( 2 );
  }

  /**
   * Calculates overall total cash
   *
   * @param {array} orders
   */
  function calcOverallTotal( orders ){

    // Sum totals
    var total = orders.reduce( function( memo, order ){
      return memo + parseFloat( order.periodTotal );
    }, 0);

    // Round to two decimal places
    return parseFloat( total ).toFixed( 2 );
  }

  var $query = {
    status: 'accepted'
  };

  var options = {
    columns: ['*', '(order_statuses.created_at at time zone orders.timezone) as created_at_local']
  , many: [{ table: 'order_items', alias: 'items' }]
  , one: [{ table: 'restaurants', alias: 'restaurant' }]
  , joins: {
      order_statuses : {
        type: 'left'
      , on: {
          $and: {
            order_id: '$orders.id$'
          , 'order_statuses.status': 'submitted'
          }
        }
      }
    }
  , limit: 'all'
  , order: ['order_statuses.created_at desc nulls last']
  };

  db.orders.find( $query, options, function( error, results ){
    if ( error ) return res.json( error );

    results = results.map( function( r ){
      var d = new Date( r.created_at_local );
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
      , periodTotal: calcPeriodTotal(result)
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
    , overallTotal:       calcOverallTotal( ordersByWeek )
    , overallUniqueUsers: utils.unique( results, function( r ){
                            return r.user_id;
                          }).length
    });

    // utils.async.parallel(
    //   results.map( function( order ){
    //     return order.getOrderItems.bind( order )
    //   }).concat( results.map( function( order ){
    //     return order.getRestaurant.bind( order );
    //   }))

    // , function( error ){
    //     if ( error ) return res.json( error );

    //     results = results.map( function( r ){
    //       r = r.toJSON();
    //       var d = new Date( r.created_at_local );
    //       r.week_number = getWeekNumber( d );
    //       r.year_number = d.getFullYear();
    //       return r;
    //     });

    //     var start = { year: 2013, week: 40 };
    //     var curr = { year: 2013, week: 40 };
    //     var d = new Date();
    //     var now = { year: d.getFullYear(), week: getWeekNumber( d ) };
    //     var ordersByWeek = [];
    //     var result;
    //     var stop = false;

    //     while ( !stop ){
    //       result = results.filter( function( r ){
    //         return r.year_number === curr.year && r.week_number === curr.week;
    //       });

    //       ordersByWeek.push({
    //         period: [ curr.year, 'Week', curr.week ].join(' ')
    //       , numberOfOrders: result.length
    //       , periodTotal: calcPeriodTotal(result)
    //       , uniqueUsers:  utils.unique( result, function( r ){
    //                         return r.user_id
    //                       }).length
    //       })

    //       curr.week++;
    //       if ( curr.week === 53 ){
    //         curr.week = 1;
    //         curr.year++;
    //       }

    //       if ( curr.year === now.year ){
    //         if ( curr.week === now.week + 1 ) stop = true;
    //       }
    //     }

    //     results.sort( function( a, b ){
    //       return a.id > b.id;
    //     });

    //     res.render( 'analytics', {
    //       orders:             results
    //     , ordersByWeek:       ordersByWeek
    //     , overallTotal:       calcOverallTotal(ordersByWeek)
    //     , overallUniqueUsers: utils.unique( results, function( r ){
    //                             return r.user_id;
    //                           }).length
    //     });
    //   }
    // );
  });
};