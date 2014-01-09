var express = require('express');
var config = require('./config');
var controllers = require('./controllers');
var utils = require('./utils');
var Models = require('./models');
var hbHelpers = require('./public/js/lib/hb-helpers')

var m = utils.extend({
  orderParams   : require('./middleware/order-params'),
  restrict      : require('./middleware/restrict'),
  basicAuth     : require('./middleware/basic-session-auth'),
  buildReceipt  : require('./middleware/build-receipt')
}, require('stdm') );

module.exports.register = function(app) {

  app.get('/', m.restrict(['client', 'admin']), function(req, res) { res.redirect('/restaurants'); });

  /**
   * Restaurants resource.  The collection of all restaurants.
   */

  app.get('/restaurants',
    m.restrict(['client', 'admin']),
    function(req, res, next) {
      if (req.query.edit) return next();
      controllers.restaurants.list.apply(this, arguments);
    }
  );

  app.get('/restaurants', m.restrict('admin'), controllers.restaurants.editAll);

  app.post('/restaurants', m.restrict('admin'), controllers.restaurants.create);

  app.all('/restaurants', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Restaurant resource.  An individual restaurant.
   */

  app.get('/restaurants/:rid', m.restrict(['client', 'admin']), controllers.restaurants.orders.current);  // individual restaurant needs current order.

  app.get('/restaurants/:rid', m.restrict(['client', 'admin']), function(req, res, next) {
    if (req.query.edit) return next();
    controllers.restaurants.get.apply(this, arguments);
  });

  app.get('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.edit);

  app.put('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.update);

  app.patch('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.update);

  app.del('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.remove);

  app.all('/restaurants/:rid', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    res.send(405);
  });

  app.get('/restaurants/:rid/sort', m.restrict('admin'), controllers.restaurants.sort);

  /**
   * Restaurant items resource.  The collection of all items belonging to a restaurant.
   */

  app.get('/restaurants/:rid/items', m.restrict(['client', 'admin']), controllers.restaurants.listItems);  // not currently used

  app.all('/restaurants/:rid/items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   * Restaurant categories resource.  The collection of all categories belonging to a restaurant.
   */

  app.get('/restaurants/:rid/categories', m.restrict(['client', 'admin']), controllers.restaurants.categories.list);  // not currently used

  app.post('/restaurants/:rid/categories', m.restrict('admin'), controllers.restaurants.categories.create);

  app.all('/restaurants/:rid/categories', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Individual category resource.  A single restaurant category.
   */

  app.get('/restaurants/:rid/categories/:cid', m.restrict(['client', 'admin']), controllers.restaurants.categories.get);  // not currently used

  app.put('/restaurants/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.update);

  app.patch('/restaurants/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.update);

  app.del('/restaurants/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.remove);

  app.all('/restaurants/:rid/categories/:cid', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    res.send(405);
  });

  /**
   *  Category items resource.  The collection of all items belonging to a single category.
   */

  app.get('/restaurants/:rid/categories/:cid/items', m.restrict(['client', 'admin']), controllers.restaurants.categories.listItems);  // not currently used

  app.post('/restaurants/:rid/categories/:cid/items', m.restrict('admin'), controllers.restaurants.categories.addItem);

  app.all('/restaurants/:rid/categories/:cid/items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Restaurant orders resource.  The collection of all orders belonging to a single restaurant.
   */

  app.get('/restaurants/:rid/orders', m.restrict('admin'), controllers.restaurants.orders.list);

  app.post('/restaurants/:rid/orders', m.restrict(['client', 'admin']), function(req, res, next) {
    req.body.restaurant_id = req.params.rid;
    req.url = '/orders';
    next();
  });

  app.all('/restaurants/:rid/orders', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Current order resource.  The current pending order for the given restaurant and logged in user.
   */

  app.all('/restaurants/:rid/orders/current(/*)?', m.restrict(['client', 'admin']), controllers.restaurants.orders.current);

  /**
   *  Items resource.  The collection of all items.
   */

  app.get('/items', m.restrict(['client', 'admin']), controllers.items.list);  // not currently used

  app.all('/items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Item resource.  An individual item.
   */

  app.get('/items/:id', m.restrict(['client', 'admin']), controllers.items.get);  // not currently used

  app.put('/items/:id', m.restrict('admin'), controllers.items.update);

  app.patch('/items/:id', m.restrict('admin'), controllers.items.update);

  app.del('/items/:id', m.restrict('admin'), controllers.items.remove);

  app.all('/items/:id', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH,  DELETE');
    res.send(405);
  });

  /**
   *  Orders resource.  The collection of all orders.
   */

  app.get('/orders', m.restrict('admin'), controllers.orders.list);  // not currently used

  app.post('/orders', m.restrict(['client', 'admin']), controllers.orders.create);

  app.all('/orders', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Order voice resource.  TwiML for phone notifications of order submitted.
   */

  app.get('/orders/:oid/voice', controllers.orders.voice);

  app.all('/orders/:oid/voice', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });


  /**
   *  Order resource.  An individual order.
   */


  app.get(
    config.receipt.orderRoute
  , m.basicAuth()
  , m.restrict(['admin', 'receipts'])
  , function(req, res, next){ req.params.receipt = true; next(); }
  , controllers.orders.get
  );

  app.all(/^\/orders\/(\d+)(?:\/.*)?$/, function (req, res, next) {
    req.params.id = req.params[0];
    next();
  }, controllers.orders.auth);

  app.get('/orders/:oid'
    // If they're using ?receipt=true, make sure we restrict the group
  , function(req, res, next){
      // If they were using a review_token we don't need to worry about it
      // since the controllers.orders.auth middleware would have taken care of it
      if (req.param('review_token') && !req.param('receipt')) return next();

      return (
        m.restrict(!req.param('receipt') ? ['admin', 'client'] : ['admin', 'receipts'])
      )(req, res, next);
    }
  , controllers.orders.get
  );

  app.put('/orders/:oid', m.restrict(['client', 'admin']), controllers.orders.update);

  app.patch('/orders/:oid', m.restrict(['client', 'admin']), controllers.orders.editability, controllers.orders.update);

  app.del('/orders/:oid', m.restrict(['client', 'admin']), function(req, res, next) {
    req.body = {status: 'canceled'};
    next();
  }, controllers.orders.changeStatus);

  app.all('/orders/:oid', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST, PUT, PATCH, DELETE');
    res.send(405);
  });


  app.get('/receipts/order-:oid.pdf', m.buildReceipt(), express.static(__dirname + '/public'));

  /**
   *  Order status resource.  The collection of all statuses on a single order.
   */

  app.get('/orders/:oid/status-history', m.restrict(['client', 'admin']), controllers.orders.listStatus); // latest is on order.  not currently used.

  // people with restaurant review token can access this route.  leave auth to controllers.orders.auth.
  app.post('/orders/:oid/status-history', controllers.orders.changeStatus);

  app.all('/orders/:oid/status-history', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order items resource.  The collection of all order items on a single order.
   *  This is a collection of OrderItems, not Items.
   */

  //app.get('/orders/:oid/items', m.restrict(['client', 'admin']), controllers.orders.orderItems.list);  // not currently used
  app.get('/orders/:oid/items', m.restrict(['client', 'admin']), controllers.orders.orderItems.summary);  // not currently used

  app.post('/orders/:oid/items', m.restrict(['client', 'admin']), controllers.orders.editability, controllers.orders.orderItems.add);

  app.all('/orders/:oid/items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order item resource.  A single order item.
   */

  app.get('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.orderItems.get);  // not currently used

  app.put('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.editability, controllers.orders.orderItems.update);

  app.patch('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.editability, controllers.orders.orderItems.update);

  app.del('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.editability, controllers.orders.orderItems.remove);

  app.all('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    res.send(405);
  });

  /**
   * Order Duplicates resource.  Duplicates of an order.
   */

  app.post('/orders/:oid/duplicates', m.restrict(['client', 'admin']), controllers.orders.duplicate);

  app.all('/orders/:oid/duplicates', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'POST');
    res.send(405);
  });

  /**
   * Order add items resource.  Page to add items to an order.  (basically the menu page)
   */

  app.get('/orders/:oid/add-items', m.restrict(['client', 'admin']), controllers.restaurants.orders.get);

  app.all('/orders/:oid/add-items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Auth page resource.  Simple static login/register page.
   *  Also includes /logout route as a convienence so people can logout by loading a url.
   */

  app.get('/auth', controllers.auth.index);

  app.post('/auth', controllers.session.create);

  app.all('/auth', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  app.all('/auth/logout', controllers.session.del);

  /**
   *  Session resource.  Create and delete session to log in / out.
   */

  app.get('/session', controllers.session.get);

  app.post('/session', controllers.session.create);

  app.del('/session', controllers.session.del)

  app.all('/session', function(req, res, next) {
    res.set('Allow', 'GET, POST, DELETE');
    res.send(405);
  });


  // For the order params
  app.get('/session/order-params', m.restrict(['client', 'admin']), controllers.session.getOrderParams);

  app.put('/session/order-params', m.restrict(['client', 'admin']), controllers.session.updateOrderParams);

  /**
   *  Users resource.  All the users.
   */

  app.get('/users', m.restrict('admin'), controllers.users.list); // not currently used

  app.post('/users', m.restrict('admin'), controllers.users.create);

  app.all('/users', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * User return resource. Restore admin session after impersonating another user.
   * Placed higher in the stack so 'client' users can access this route
   */

  app.get('/users/return', controllers.users.returnSession);

  app.all('/users/return', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Current user resource.
   */

   app.all (/^\/users\/me(?:\/.*)?$/, function(req, res, next) {
    if (!req.session.user) res.send(404);
    else {
      req.url = req.url.replace(/^\/users\/me/, '/users/' + req.session.user.id);
      next();
    }
  });

  app.all(/^\/users\/(\d+)(?:\/.*)?$/, function(req, res, next) {
    if (!req.session.user || (req.session.user.groups.indexOf('admin') === -1 && ''+req.params[0] !== ''+req.session.user.id))
      res.send(404);
    else
      next();
  });

  app.get('/users/:uid', controllers.users.get);

  app.put('/users/:uid', controllers.users.update);

  app.del('/users/:uid', function(req, res) { res.send(501); });

  app.all('/users/:uid', function(req, res, next) {
    res.set('Allow', 'GET, PUT, DELETE');
    res.send(405);
  });

  /**
   *  User Orders resource.  All the orders placed by an individual user.
   */

  app.get('/users/:uid/orders', controllers.users.listOrders);

  app.all('/users/:uid', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  User Addresseses resource.
   */

  app.get('/users/:uid/addresses', controllers.users.addresses.list);

  app.post('/users/:uid/addresses', controllers.users.addresses.create);

  app.all('/users/:uid/addresses', function(req, res, next) {
    res.set('Allow', 'GET', 'POST');
    res.send(405);
  });

  /**
   * User Address resource. Represents a single address per user
   */

  app.get('/users/:uid/addresses/:aid', controllers.users.addresses.get);

  app.put('/users/:uid/addresses/:aid', controllers.users.addresses.update);

  app.patch('/users/:uid/addresses/:aid', controllers.users.addresses.update);

  app.del('/users/:uid/addresses/:aid', controllers.users.addresses.remove);

  app.all('/users/:uid/addresses/:aid', function(req, res, next) {
    res.set('Allow', 'GET', 'PUT', 'PATCH', 'DELETE');
    res.send(405);
  });

  /**
   * User cards resource
   */

  app.get('/users/:uid/cards', controllers.users.cards.list);

  app.post('/users/:uid/cards', controllers.users.cards.create);

  app.get('/users/:uid/cards/:cid', controllers.users.cards.get);

  app.put('/users/:uid/cards/:cid', controllers.users.cards.update);

  app.patch('/users/:uid/cards/:cid', controllers.users.cards.update);

  app.del('/users/:uid/cards/:cid', controllers.users.cards.remove);

  app.all('/users/:uid/cards/:cid', function(req, res, next) {
    res.set('Allow', 'GET', 'PUT', 'PATCH', 'DELETE');
    res.send(405);
  });

  /**
   *  User session resource.  Represents a session as a specific user.
   */

  app.get('/users/:uid/session', controllers.users.createSessionAs);

  app.post('/users/:uid/session', controllers.users.createSessionAs);

  app.all('/users/:uid/session', function(req, res, next) {
    res.set('Allow', 'GET', 'POST');
    res.send(405);
  });

  /**
   *  Password reset resource
   */

  app.post('/password-resets', controllers.users.passwordResets.create);

  app.get('/password-resets/:token', controllers.users.passwordResets.get);

  app.put('/password-resets/:token', controllers.users.passwordResets.redeem);

  /**
   *  Waitlist resource
   */

  app.post('/waitlist', controllers.waitlist.add);

  // needs to be get for one click links in email.
  app.get('/waitlist/unsubscribe', controllers.waitlist.remove);

  app.get('/waitlist/confirm', controllers.waitlist.confirm);

  /**
   *  Static pages
   */

  app.get('/signup', m.restrict('admin'), controllers.statics.createUser);

  app.get('/contact-us', controllers.statics.contactUs);

  app.post('/contact-us', controllers.contactUs.sendSupportEmail);

  app.get('/legal', controllers.statics.legal);

  app.get('/privacy', controllers.statics.privacy);

  app.get('/analytics'
  , m.restrict(['admin'])
  , function( req, res ){
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
      , limit: 9999999999
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
    }
  )
}
