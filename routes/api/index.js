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

/**
 * @api {get} /users/me Returns your user profile.
 * @apiName GetUsersMe
 * @apiGroup Users
 * @apiPermission none

 * @apiSuccess   {Object}     user                  Your user account.
 * @apiSuccess   {Number}     user.id               Your user id.
 * @apiSuccess   {String}     user.created_at       Timestamp when your profile was created.
 * @apiSuccess   {String}     user.email            Your email.
 * @apiSuccess   {String}     user.organization     Your organization.
 * @apiSuccess   {String}     user.name             Your name.
 * @apiSuccess   {String}     user.balanced_customer_uri     Your balanced customer uri.
 * @apiSuccess   {Boolean}    user.is_invoiced      "True" if invoiced.
 * @apiSuccess   {Number}     user.points           Your total reward points.
 * @apiSuccess   {Number}     user.region_id        Your region id.
 * @apiSuccess   {String}     user.default_zip      Your default zipcode.
 * @apiSuccess   {String}     user.ordrin_email     *Obsolete crap*
 * @apiSuccess   {String}     user.ordrin_password  *Obsolete crap*
 * @apiSuccess   {Boolean}    user.is_tax_exempt    "True" if user is tax exempt.
 * @apiSuccess   {String}     user.user_agent       Your user agent.
 * @apiSuccess   {String}     user.organization_type        Your organization type.
 * @apiSuccess   {String}     user.stripe_id        Your stripe id.
 * @apiSuccess   {Boolean}    user.is_deleted       "True" if user's account is deactivated.
 * @apiSuccess   {Number}     user.priority_account_price_hike_percentage     Percentage on menu items for a priority account.

 * @apiSuccess   {Object}     user.region               Your region.
 * @apiSuccess   {Number}     user.region.id            Region id.
 * @apiSuccess   {String}     user.region.name          Region name.
 * @apiSuccess   {String}     user.region.state         Region state.
 * @apiSuccess   {String[]}   user.region.cities        List of region cities.
 * @apiSuccess   {String}     user.region.timezone      Region timezone.
 * @apiSuccess   {Number}     user.region.sales_tax     Region sales tax.
 * @apiSuccess   {Object}     user.region.lead_time_modifier             Region lead time modifier.
 * @apiSuccess   {Number}     user.region.lead_time_modifier.minutes     Region lead time modifier.
 * @apiSuccess   {Boolean}    user.region.is_hidden     "True" if region is hidden.
 * @apiSuccess   {Boolean}    user.region.sorts_by_no_contract           "True" if region is sorted by no contract.
 * @apiSuccess   {String[]}   user.region.zips           List of region zipcodes.

 * @apiSuccess   {Object}     user.defaultAddress              Your default address.
 * @apiSuccess   {Number}     user.defaultAddress.id           Default address id.
 * @apiSuccess   {Number}     user.defaultAddress.user_id      Default address user id.
 * @apiSuccess   {String}     user.defaultAddress.name         Default address name.
 * @apiSuccess   {String}     user.defaultAddress.street       Default address street.
 * @apiSuccess   {String}     user.defaultAddress.city         Default address city.
 * @apiSuccess   {String}     user.defaultAddress.state        Default address state.
 * @apiSuccess   {String}     user.defaultAddress.zip          Default address zipcode.
 * @apiSuccess   {Boolean}    user.defaultAddress.is_default   "True" if address is the default address.
 * @apiSuccess   {String}     user.defaultAddress.street2      Default address street, second line.
 * @apiSuccess   {String}     user.defaultAddress.phone        Default address phone.
 * @apiSuccess   {String}     user.defaultAddress.delivery_instructions     Delivery instructions for default address.
 * @apiSuccess   {String}     user.defaultAddress.lat_lng      Latitude/longitude of default address.

 * @apiSuccess   {Object[]}   user.addresses                 List of your available addresses.
 * @apiSuccess   {Number}     user.addresses.id              Address id.
 * @apiSuccess   {Number}     user.addresses.user_id         Address user id.
 * @apiSuccess   {String}     user.addresses.name            Address name.
 * @apiSuccess   {String}     user.addresses.street          Address street.
 * @apiSuccess   {String}     user.addresses.city            Address city.
 * @apiSuccess   {String}     user.addresses.state           Address state.
 * @apiSuccess   {String}     user.addresses.zip             Address zipcode.
 * @apiSuccess   {Boolean}    user.addresses.is_default      "True" if address is the default address.
 * @apiSuccess   {String}     user.addresses.street2         Address street, second line.
 * @apiSuccess   {String}     user.addresses.phone           Address phone.
 * @apiSuccess   {String}     user.addresses.delivery_instructions    Delivery instructions for address.
 * @apiSuccess   {String}     user.addresses.lat_lng         Latitude/longitude of address.

 * @apiSuccess   {String[]}   user.groups      List of permissions.
 * @apiSuccess   {Boolean}    user.isAdmin     "True" if your account is an admin.
 **/
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
 **/
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
