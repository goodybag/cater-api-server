var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');

var route = module.exports = express.Router();

route.use('/restaurants', require('./restaurants'));
route.use('/orders', require('./orders'));
route.use('/amenities', require('./amenities'));
route.use('/invoices', require('./invoices'));
route.use('/payments', require('./payments'));

/**
 * Users
 */

route.post('/users/:uid/rewards'
, m.restrict(['admin', 'client'])
, m.owner()
, controllers.users.rewards.redeem
);

route.get('/users'
, m.restrict(['admin'])
, m.sort('-id')
, m.queryOptions({
    many: [{ table: 'addresses' }, { table: 'orders' }]
  })
, m.find( db.users )
);

route.get('/users/me'
, function( req, res ){
    delete req.user.attributes.password;
    res.json( req.user );
  }
);

route.get('/users/:id'
, m.restrict(['admin'])
, m.param('id')
, m.sort('-id')
, m.queryOptions({
    many: [
      { table: 'addresses' }
    , { table: 'users_groups', alias: 'groups' }
    ]
  })
, m.find( db.users )
);

route.put('/users/:id'
, m.restrict(['admin'])
, m.param('id')
, m.updateStripeCustomer({ required: 'user', pick: ['name'] })
, m.update( db.users )
);

route.delete('/users/:id'
, m.restrict(['admin'])
, m.param('id')
, m.remove( db.users )
);

/**
 * Delivery Services
 */

/**
 * @api {get} /delivery_services Returns a list of all delivery services.
 * @apiName GetDeliveryServices
 * @apiGroup Delivery Services
 * @apiPermission admin

 * @apiSuccess   {Object[]}   delivery_service                 List of delivery services.
 * @apiSuccess   {Number}     delivery_service.id              Delivery service id.
 * @apiSuccess   {Number}     delivery_service.region_id       Delivery service region id.
 * @apiSuccess   {String}     delivery_service.name            Delivery service name.
 * @apiSuccess   {Number}     delivery_service.rate            Delivery service rating.
 * @apiSuccess   {String}     delivery_service.created_at      Timestamp when delivery service was created.
 * @apiSuccess   {String}     delivery_service.order_email     Delivery service order email.
 * @apiSuccess   {String}     delivery_service.order_phone     Delivery service order phone.
 * @apiSuccess   {Number}     delivery_service.region_order_distribution           Delivery service region order distribution.
 * @apiSuccess   {String}     delivery_service.order_submitted_notification_id     Delivery serice order submitted notification id.

 * @apiSuccess   {Object[]}   delivery_service.zips                List of available zipcodes on delivery service.
 * @apiSuccess   {Number}     delivery_service.zips.id             Unique id for zipcode.
 * @apiSuccess   {Number}     delivery_service.zips.delivery_service_id     Delivery service id for zipcode.
 * @apiSuccess   {String}     delivery_service.zips.from           Used to calculate gb delivery fee.
 * @apiSuccess   {String}     delivery_service.zips.to             Used to calculate gb delivery fee.
 * @apiSuccess   {Number}     delivery_service.zips.price          Used to calculate gb delivery fee.
 * @apiSuccess   {String}     delivery_service.zips.created_at     Timestamp when zip was added.

 * @apiSuccess   {Object}     delivery_service.region               Region covered by delivery service.
 * @apiSuccess   {Number}     delivery_service.region.id            Region id.
 * @apiSuccess   {String}     delivery_service.region.name          Region name.
 * @apiSuccess   {String}     delivery_service.region.state         Region state.
 * @apiSuccess   {String[]}   delivery_service.region.cities        List of cities in region.
 * @apiSuccess   {String}     delivery_service.region.timezone      Region timezone.
 * @apiSuccess   {Number}     delivery_service.region.sales_tax     Region salex tax.
 * @apiSuccess   {String}     delivery_service.region.lead_time_modifier     Region lead time modifier.
 * @apiSuccess   {Boolean}    delivery_service.region.is_hidden     "True" if region is hidden.
 * @apiSuccess   {Boolean}    delivery_service.region.sorts_by_no_contract     "True" if sorted by no contract.
 */
route.get('/delivery-services'
, m.restrict(['admin'])
, m.sort('-id')
, m.param('region_id')
, m.queryOptions({
    many: [{ table: 'delivery_service_zips', alias: 'zips' }]
  , one:  [{ table: 'regions', alias: 'region' }]
  })
, m.find( db.delivery_services )
);

route.post('/delivery-services'
, m.restrict(['admin'])
, m.insert( db.delivery_services )
);

route.get('/delivery-services/:id'
, m.restrict(['admin'])
, m.param('id')
, m.findOne( db.delivery_services )
);

route.put('/delivery-services/:id'
, m.restrict(['admin'])
, m.param('id')
, m.update( db.delivery_services )
);

route.delete('/delivery-services/:id'
, m.restrict(['admin'])
, m.param('id')
, m.remove( db.delivery_services )
);

/**
 * Maps
 */

route.get('/maps/geocode/:address'
, controllers.api.maps.geocode
);

route.get('/stripe-events/:id'
, m.restrict(['admin'])
, m.stripe.getStripeEvent()
);
