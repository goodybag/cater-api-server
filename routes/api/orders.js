var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var venter = require('../../lib/venter');

var route = module.exports = express.Router();

/**
 * @api {get} /orders   Returns all restaurant orders.
 * @apiName GetOrders
 * @apiGroup Restaurant Orders
 * @apiPermission admin

 * @apiSuccess   {Object[]}   orders                                 List of all restaurant orders.
 * @apiSuccess   {Number}     orders.id                              Order id.
 * @apiSuccess   {String}     orders.created_at                      Timestamp when order was created.
 * @apiSuccess   {Number}     orders.user_id                         Order user id.
 * @apiSuccess   {Number}     orders.restaurant_id                   Order restaurant id.
 * @apiSuccess   {String}     orders.street                          Order address street.
 * @apiSuccess   {String}     orders.city                            Order address city.
 * @apiSuccess   {String}     orders.state                           Order address state.
 * @apiSuccess   {String}     orders.zip                             Order address zipcode.
 * @apiSuccess   {String}     orders.phone                           Order address phone.
 * @apiSuccess   {String}     orders.notes                           Order notes.
 * @apiSuccess   {String}     orders.datetime                        Order datetime.
 * @apiSuccess   {String}     orders.timezone                        Order timezone.
 * @apiSuccess   {Number}     orders.guests                          Number of guests on order.
 * @apiSuccess   {String}     orders.review_token                    Order review token.
 * @apiSuccess   {Boolean}    orders.token_used                      "True" if review token used.
 * @apiSuccess   {Number}     orders.adjustment_amount               Order adjustment amount.
 * @apiSuccess   {String}     orders.adjustment_description          Order adjustment description.
 * @apiSuccess   {Number}     orders.tip                             Order tip.
 * @apiSuccess   {String}     orders.name                            Order name.
 * @apiSuccess   {String}     orders.street2                         Order address street, second line.
 * @apiSuccess   {String}     orders.delivery_instructions           Order delivery instrunctions.
 * @apiSuccess   {Number}     orders.tip_percent                     Order tip percent.
 * @apiSuccess   {String}     orders.status                          Order status.
 * @apiSuccess   {String}     orders.cut                             Order cut.
 * @apiSuccess   {Number}     orders.payment_method_id               Order id for payment method.
 * @apiSuccess   {String}     orders.payment_status                  Order payment status.
 * @apiSuccess   {String}     orders.uuid                            Order uuid.
 * @apiSuccess   {String}     orders.reason_denied                   Order reason denied.
 * @apiSuccess   {Number}     orders.reviewed                        Number of times order was reviewed.
 * @apiSuccess   {String}     orders.edit_token                      Order edit token.
 * @apiSuccess   {Boolean}    orders.edit_token_expires              "True" if edit token expires.
 * @apiSuccess   {Boolean}    orders.points_awarded                  "True" if points awarded on order.
 * @apiSuccess   {Number}     orders.delivery_service_id             Order delivery service id.
 * @apiSuccess   {Number}     orders.sub_total                       Order subtotal.
 * @apiSuccess   {Number}     orders.sales_tax                       Order salex tax.
 * @apiSuccess   {Number}     orders.total                           Order total.
 * @apiSuccess   {Number}     orders.delivery_fee                    Order delivery fee.
 * @apiSuccess   {String}     orders.pickup_datetime                 Order pickup datetime.
 * @apiSuccess   {String}     orders.ds_token                        Order ds token.
 * @apiSuccess   {Boolean}    orders.ds_token_used                   "True" if ds token used.
 * @apiSuccess   {String}     orders.type                            Order type.
 * @apiSuccess   {String}     orders.search_vector                   Order search vector.
 * @apiSuccess   {Number}     orders.user_adjustment_amount          Order user adjustment amount.
 * @apiSuccess   {String}     orders.user_adjustment_description     Order user adjustment description.
 * @apiSuccess   {Number}     orders.restaurant_total                Order restaurant total.
 * @apiSuccess   {Number}     orders.restaurant_sales_tax            Order restaurant sales tax.
 * @apiSuccess   {Number}     orders.restaurant_location_id          Order restaurant location id.
 * @apiSuccess   {Number}     orders.no_contract_amount              Order no contract amount.
 * @apiSuccess   {String}     orders.secondary_contact_phone         Order secondary contact phone.
 * @apiSuccess   {String}     orders.promo_code                      Order promo code used.
 * @apiSuccess   {String}     orders.address_name                    Order address name.
 * @apiSuccess   {Object}     orders.lat_lng                         Order latitude/longitude.
 * @apiSuccess   {Number}     orders.lat_lng.x                       X coordinate.
 * @apiSuccess   {Number}     orders.lat_lng.y                       Y coordinate.
 * @apiSuccess   {Number}     orders.priority_account_price_hike_percentage     Percentage on menu items for a priority account.

 * @apiSuccess   {Object}     orders.user                           User on order.
 * @apiSuccess   {Number}     orders.user.id                        User id.
 * @apiSuccess   {String}     orders.user.created_at                Timestamp when user account was created.
 * @apiSuccess   {String}     orders.user.email                     User email.
 * @apiSuccess   {String}     orders.user.organization              User organization.
 * @apiSuccess   {String}     orders.user.name                      User name.
 * @apiSuccess   {String}     orders.user.balanced_customer_uri     User balanced customer uri.
 * @apiSuccess   {Boolean}    orders.user.is_invoiced               "True" if account is invoiced.
 * @apiSuccess   {Number}     orders.user.points                    User total reward points.
 * @apiSuccess   {Number}     orders.user.region_id                 User region id.
 * @apiSuccess   {String}     orders.user.default_zip               User default zipcode.
 * @apiSuccess   {String}     orders.user.ordrin_email              *Obsolete crap*
 * @apiSuccess   {String}     orders.user.ordrin_password           *Obsolete crap*
 * @apiSuccess   {Boolean}    orders.user.is_tax_exempt             "True" if account is tax exempt.
 * @apiSuccess   {String}     orders.user.user_agent                User agent information.
 * @apiSuccess   {String}     orders.user.organization_type         User organization type.
 * @apiSuccess   {String}     orders.user.stripe_id                 User stripe id.
 * @apiSuccess   {Boolean}    orders.user.is_deleted                "True" if account is deactivated.
 * @apiSuccess   {Number}     orders.user.priority_account_price_hike_percentage     Percentage on menu items for a priority account.

 * @apiSuccess   {Object}     orders.restaurant                           Restaurant on order.
 * @apiSuccess   {Number}     orders.restaurant.id                        Restaurant id.
 * @apiSuccess   {String}     orders.restaurant.created_at                Timestamp when restaurant was created.
 * @apiSuccess   {String}     orders.restaurant.name                      Restaurant name.
 * @apiSuccess   {String}     orders.restaurant.street                    Restaurant street.
 * @apiSuccess   {String}     orders.restaurant.city                      Restaurant city.
 * @apiSuccess   {String}     orders.restaurant.state                     Restaurant state.
 * @apiSuccess   {String}     orders.restaurant.zip                       Restaurant zipcode.
 * @apiSuccess   {Number}     orders.restaurant.minimum_order             Restaurant minimum order.
 * @apiSuccess   {Number}     orders.restaurant.price                     Restaurant price index.
 * @apiSuccess   {String[]}   orders.restaurant.cuisine                   List of restaurant cuisine types.
 * @apiSuccess   {Boolean}    orders.restaurant.is_hidden                 "True" if restaurant is hidden.
 * @apiSuccess   {Number}     orders.restaurant.address_id                Restaurant address id.
 * @apiSuccess   {String}     orders.restaurant.logo_url                  Restaurant logo url.
 * @apiSuccess   {String}     orders.restaurant.logo_mono_url             Restaurant logo mono url.
 * @apiSuccess   {String}     orders.restaurant.street2                   Restaurant street, second line.
 * @apiSuccess   {String}     orders.restaurant.delivery_instructions     Restaurant delivery instructions.
 * @apiSuccess   {String}     orders.restaurant.balanced_customer_uri     Restaurant balanced customer uri.
 * @apiSuccess   {Number}     orders.restaurant.payment_method_id         Restaurant payment method id.
 * @apiSuccess   {String}     orders.restaurant.yelp_business_id          Restaurant yelp business id.
 * @apiSuccess   {String}     orders.restaurant.description               Restaurant description.
 * @apiSuccess   {String[]}   orders.restaurant.websites                  List of restaurant websites.
 * @apiSuccess   {String}     orders.restaurant.display_phone             Restaurant display phone.
 * @apiSuccess   {String[]}   orders.restaurant.emails                    List of restaurant emails.
 * @apiSuccess   {String[]}   orders.restaurant.sms_phones                List of restaurant sms phones.
 * @apiSuccess   {String[]}   orders.restaurant.voice_phones              List of restaurant voice phones.
 * @apiSuccess   {String}     orders.restaurant.billing_email             Restaurant billing email.
 * @apiSuccess   {String}     orders.restaurant.billing_street            Restaurant billing street address.
 * @apiSuccess   {String}     orders.restaurant.billing_street2           Restaurant billing street address, second line.
 * @apiSuccess   {String}     orders.restaurant.billing_city              Restaurant billing address city.
 * @apiSuccess   {String}     orders.restaurant.billing_state             Restaurant billing address state.
 * @apiSuccess   {String}     orders.restaurant.billing_zip               Restaurant billing address zipcode.
 * @apiSuccess   {Number}     orders.restaurant.gb_fee                    Restaurant goodybag fee.
 * @apiSuccess   {Boolean}    orders.restaurant.is_direct_deposit         "True" if restaurant uses direct deposit.
 * @apiSuccess   {Boolean}    orders.restaurant.is_fee_on_total           *Obsolete crap*
 * @apiSuccess   {Number}     orders.restaurant.region_id                 Restaurant region id.
 * @apiSuccess   {Number}     orders.restaurant.delivery_service_order_amount_threshold     Restaurant delivery service order amount threshold.
 * @apiSuccess   {Number}     orders.restaurant.delivery_service_head_count_threshold       Restaurant delivery service head count threshold.
 * @apiSuccess   {Number}     orders.restaurant.delivery_service_order_total_upperbound     Restaurant delivery service order total upperbound.
 * @apiSuccess   {Boolean}    orders.restaurant.disable_courier           "True" if courier disabled on restaurant.
 * @apiSuccess   {Number}     orders.restaurant.pms_contact_id            Restaurant pms contact id.
 * @apiSuccess   {String}     orders.restaurant.search_vector             Restaurant search vector.
 * @apiSuccess   {Boolean}    orders.restaurant.has_contract              "True" if restaurant has contract.
 * @apiSuccess   {Number}     orders.restaurant.no_contract_fee           Restaurant no contract fee.
 * @apiSuccess   {Number}     orders.restaurant.plan_id                   Restaurant plan id.
 * @apiSuccess   {String}     orders.restaurant.list_photo_url            Restaurant list photo url.
 * @apiSuccess   {String}     orders.restaurant.text_id                   Restaurant text id.
 * @apiSuccess   {Boolean}    orders.restaurant.disable_courier_notifications     "True" if courier notifications disabled on restaurant.
 * @apiSuccess   {Number}     orders.restaurant.popularity                Restaurant popularity.
 * @apiSuccess   {Boolean}    orders.restaurant.is_archived               "True" if restaurant is archived.
 * @apiSuccess   {Boolean}    orders.restaurant.is_featured               "True" if restaurant is featured.
 * @apiSuccess   {String[]}   orders.restaurant.supported_order_types     List of supported order types on restaurant.
 * @apiSuccess   {String}     orders.restaurant.stripe_id                 Restaurant stripe id.
 * @apiSuccess   {String}     orders.restaurant.uuid                      Restaurant uuid.
 * @apiSuccess   {Boolean}    orders.restaurant.collect_payments          "True" if restaurant payments automatically transferred to Goodybag's Stripe account.
 * @apiSuccess   {Boolean}    orders.restaurant.accepts_tips              "True" if restaurant accepts tips.

 * @apiSuccess   {Object}     orders.restaurant.yelp_data                 Yelp data on restaurant.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.url             Yelp url.
 * @apiSuccess   {Number}     orders.restaurant.yelp_data.review_count    Yelp review count.
 * @apiSuccess   {Number}     orders.restaurant.yelp_data.rating          Yelp rating.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.rating_img_url           Yelp url for rating image.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.rating_img_url_small     Yelp url for rating image (small).
 * @apiSuccess   {String}     orders.restaurant.yelp_data.rating_img_url_large     Yelp url for rating image (large).

 * @apiSuccess   {Object[]}   orders.restaurant.yelp_data.reviews                  List of yelp reviews.
 * @apiSuccess   {Number}     orders.restaurant.yelp_data.reviews.rating           Review rating.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.reviews.excerpt          Review excerpt.
 * @apiSuccess   {Number}     orders.restaurant.yelp_data.reviews.time_created     Timestamp when review was created.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.reviews.rating_img_url             Rating image url for review.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.reviews.rating_img_small_url       Rating image url (small) for review.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.reviews.rating_image_large_url     Rating image url (large) for review.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.reviews.id               Review id.

 * @apiSuccess   {Object}     orders.restaurant.yelp_data.reviews.user             User on yelp review.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.reviews.user.image_url   User image url.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.reviews.user.id          User id.
 * @apiSuccess   {String}     orders.restaurant.yelp_data.reviews.user.name        User name.
 **/
route.get('/', m.restrict(['admin']), m.pagination(), m.param('status'), function(req, res, next) {
  res.locals.status = req.params.status;
  if (req.params.status == 'accepted') {
    req.queryOptions.statusDateSort = {
      status: req.params.status
    };
  }
  return next();
}, m.sort('-id'), m.queryOptions({
  one: [{
    table: 'users',
    alias: 'user'
  }, {
    table: 'restaurants',
    alias: 'restaurant'
  }]
}), m.find(db.orders));

route.post('/', m.restrict(['admin']), m.insert(db.orders));

/**
 * @api {get} /orders/search?q=:text   Returns all restaurant orders that match search criteria.
 * @apiParam {String} text             Search query string.
 * @apiParamExample
    {
      "text": "dos%20batos%20tacos"
    }
 * @apiName GetOrdersFromSearch
 * @apiGroup Restaurant Orders
 * @apiPermission none
 **/
route.get('/search', function(req, res, next) {
  console.log("req.query", req.query);
  var query = req.query.q;
  if (!query) return next();
  req.queryObj.search_vector = {
    $partialMatches: query
  };
  req.queryObj.status = {
    $in: ['accepted', 'submitted', 'denied']
  };
  next();
}, m.sort('-id'), m.queryOptions({
  limit: 10,
  one: [{
    table: 'restaurants',
    alias: 'restaurant'
  }, {
    table: 'users',
    alias: 'user'
  }]
}), m.find(db.orders));

route.get('/:id', m.restrict(['admin']), m.getOrder2({
  param: 'id',
  items: true,
  user: true,
  userAddresses: true,
  userPaymentMethods: true,
  restaurant: true,
  deliveryService: true
}), function(req, res) {
  res.json(req.order);
});

route.put('/silent/:id', m.restrict(['admin']), m.param('id'), m.queryOptions({
  returning: ['*', {
    type: 'select',
    table: 'orders',
    columns: ['type'],
    alias: 'old_type',
    where: {
      id: '$orders.id$'
    }
  }]
}), m.audit.orderType(), m.update(db.orders));

route.put('/:id', m.restrict(['admin']), m.param('id'), m.queryOptions({
  returning: ['*', {
    type: 'select',
    table: 'orders',
    columns: ['type'],
    alias: 'old_type',
    where: {
      id: '$orders.id$'
    }
  }]
}), m.audit.orderType(), m.after(function(req, res, next) {
  if (res.statusCode >= 300 || res.statusCode < 200) {
    return next();
  }

  var id = req.params.id || req.query.id || req.body.id;
  var payment_status = req.params.payment_status || req.query.payment_status || req.body.payment_status;
  venter.emit('order:change', id);
  venter.emit('order:paymentStatus:change', payment_status, id);

  next();
})
  // Update
, function( req, res, next ){
    m.db.orders.update( req.queryObj, req.body, req.queryOptions )( req, res, next )
  }
  // Handle event emitting and sending result
, function( req, res ){
    var orders = res.locals.orders;

    res.json( orders[0] );

    var orderTypeChanged = orders &&
                            orders[0] &&
                            orders[0].type !== orders[0].old_type;

    if ( orderTypeChanged ){
      var order = orders[0];
      venter.emit( 'order:type:change', order.type, order.old_type, order, req.user );
    }
  }
);

route.delete('/:id', m.restrict(['admin']), m.param('id'), m.remove(db.orders));

route.get('/:id/delivery-fee', m.getOrder2({
  param: 'id',
  items: true,
  user: true,
  userAddresses: true,
  userPaymentMethods: true,
  restaurant: true,
  location: true,
  deliveryService: true
}), controllers.orders.getDeliveryFee);

route.get('/:oid/items', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true,
    applyPriceHike: true
  }), m.editOrderAuth, m.restrict(['admin', 'order-owner', 'order-editor']),
  controllers.orders.orderItems.list
);

route.post('/:order_id/generate_edit_token', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), controllers.orders.generateEditToken);

route.post('/:oid/rebuild-pdf/:type', m.restrict(['admin']), controllers.orders.rebuildPdf);

route.get('/:oid/notifications', m.restrict(['admin']), controllers.orders.notifications.JSON.list);

route.post('/:oid/notifications/:id', m.restrict(['admin']), controllers.orders.notifications.JSON.sendNotification);

route.get('/:oid/notifications-history', m.restrict(['admin']), controllers.orders.notifications.JSON.history);

route.get('/:oid/notifications-history/:id', m.restrict(['admin']), controllers.orders.notifications.JSON.historyItem);

route.post('/:order_id/internal-notes', m.restrict(['admin']), function(req, res, next) {
  req.body.order_id = req.params.order_id;
  req.body.user_id = req.user.attributes.id;
  return next();
}, function(req, res, next) {
  req.queryOptions.returning = db.order_internal_notes.getColumnListForTimezone(
    req.user.attributes.region.timezone
  );

  return next();
}, function(req, res, next) {
  m.db.order_internal_notes.insert(req.body, req.queryOptions)(req, res, next);
}, function(req, res, next) {
  res.locals.order_internal_note.user = req.user.attributes;
  return next();
}, m.jsonLocals('order_internal_note'));

route.delete('/:order_id/internal-notes/:id', m.restrict(['admin']), m.param('id'), m.remove(db.order_internal_notes));

/**
 * Order amenities
 */

route.post('/:order_id/amenities', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.insert(db.order_amenities));

// list amenities per order
route.get('/:order_id/amenities', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.param('order_id'), m.find(db.order_amenities));

// list specific order amenity
route.get('/:order_id/amenities/:amenity_id', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.param('order_id'), m.param(
  'amenity_id'), m.find(db.order_amenities));

// delete all order amenities
route.delete('/:order_id/amenities', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.param('order_id'), m.remove(db.order_amenities));

// delete specific order amenity
route.delete('/:order_id/amenities/:amenity_id', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.param('order_id'), m.param(
  'amenity_id'), m.remove(db.order_amenities));

/**
 * Order Feedback
 */
route.put('/:order_id/feedback', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.queryOptions({
  returning: ['id']
}), m.param('order_id'), m.update(db.order_feedback));
