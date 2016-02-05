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
 * @apiSuccess   {Boolean}    orders.reviewed                        "True" if order was reviewed.
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

/**
 * @api {get} /orders/:oid     Returns the order specified.
 * @apiParam {Number} oid      Order id.
 * @apiName GetOrder
 * @apiGroup Restaurant Orders
 * @apiPermission admin

 * @apiSuccess   {Object}     order                                 Returned order.
 * @apiSuccess   {Number}     order.id                              Order id.
 * @apiSuccess   {String}     order.created_at                      Timestamp when order was created.
 * @apiSuccess   {Number}     order.user_id                         Order user id.
 * @apiSuccess   {Number}     order.restaurant_id                   Order restaurant id.
 * @apiSuccess   {String}     order.street                          Order address street.
 * @apiSuccess   {String}     order.city                            Order address city.
 * @apiSuccess   {String}     order.state                           Order address state.
 * @apiSuccess   {String}     order.zip                             Order address zipcode.
 * @apiSuccess   {String}     order.phone                           Order address phone.
 * @apiSuccess   {String}     order.notes                           Order notes.
 * @apiSuccess   {String}     order.datetime                        Order datetime.
 * @apiSuccess   {String}     order.timezone                        Order timezone.
 * @apiSuccess   {Number}     order.guests                          Number of guests on order.
 * @apiSuccess   {String}     order.review_token                    Order review token.
 * @apiSuccess   {Boolean}    order.token_used                      "True" if review token used.
 * @apiSuccess   {Number}     order.adjustment_amount               Order adjustment amount.
 * @apiSuccess   {String}     order.adjustment_description          Order adjustment description.
 * @apiSuccess   {Number}     order.tip                             Order tip.
 * @apiSuccess   {String}     order.name                            Order name.
 * @apiSuccess   {String}     order.street2                         Order address street, second line.
 * @apiSuccess   {String}     order.delivery_instructions           Order delivery instrunctions.
 * @apiSuccess   {Number}     order.tip_percent                     Order tip percent.
 * @apiSuccess   {String}     order.status                          Order status.
 * @apiSuccess   {String}     order.cut                             Order cut.
 * @apiSuccess   {Number}     order.payment_method_id               Order id for payment method.
 * @apiSuccess   {String}     order.payment_status                  Order payment status.
 * @apiSuccess   {String}     order.uuid                            Order uuid.
 * @apiSuccess   {String}     order.reason_denied                   Order reason denied.
 * @apiSuccess   {Boolean}    order.reviewed                        "True" if order was reviewed.
 * @apiSuccess   {String}     order.edit_token                      Order edit token.
 * @apiSuccess   {Boolean}    order.edit_token_expires              "True" if edit token expires.
 * @apiSuccess   {Boolean}    order.points_awarded                  "True" if points awarded on order.
 * @apiSuccess   {Number}     order.delivery_service_id             Order delivery service id.
 * @apiSuccess   {Number}     order.sub_total                       Order subtotal.
 * @apiSuccess   {Number}     order.sales_tax                       Order salex tax.
 * @apiSuccess   {Number}     order.total                           Order total.
 * @apiSuccess   {Number}     order.delivery_fee                    Order delivery fee.
 * @apiSuccess   {String}     order.pickup_datetime                 Order pickup datetime.
 * @apiSuccess   {String}     order.ds_token                        Order ds token.
 * @apiSuccess   {Boolean}    order.ds_token_used                   "True" if ds token used.
 * @apiSuccess   {String}     order.type                            Order type.
 * @apiSuccess   {String}     order.search_vector                   Order search vector.
 * @apiSuccess   {Number}     order.user_adjustment_amount          Order user adjustment amount.
 * @apiSuccess   {String}     order.user_adjustment_description     Order user adjustment description.
 * @apiSuccess   {Number}     order.restaurant_total                Order restaurant total.
 * @apiSuccess   {Number}     order.restaurant_sales_tax            Order restaurant sales tax.
 * @apiSuccess   {Number}     order.restaurant_location_id          Order restaurant location id.
 * @apiSuccess   {Number}     order.no_contract_amount              Order no contract amount.
 * @apiSuccess   {String}     order.secondary_contact_phone         Order secondary contact phone.
 * @apiSuccess   {String}     order.promo_code                      Order promo code used.
 * @apiSuccess   {String}     order.address_name                    Order address name.
 * @apiSuccess   {Object}     order.lat_lng                         Order latitude/longitude.
 * @apiSuccess   {Number}     order.lat_lng.x                       X coordinate.
 * @apiSuccess   {Number}     order.lat_lng.y                       Y coordinate.
 * @apiSuccess   {Number}     order.priority_account_price_hike_percentage     Percentage on menu items for a priority account.
 * @apiSuccess   {String}     order.delivery_service                Order delivery service.
 * @apiSuccess   {Boolean}    order.isAdmin                         "True" if order is admin.
 * @apiSuccess   {Boolean}    order.editable                        "True" if order is editable.

 * @apiSuccess   {Object[]}   order.orderItems                      List of items on order.
 * @apiSuccess   {Number}     order.orderItems.id                   Order item id.
 * @apiSuccess   {String}     order.orderItems.created_at           Timestamp when order item was created.
 * @apiSuccess   {Number}     order.orderItems.item_id              Order item id.
 * @apiSuccess   {Number}     order.orderItems.order_id             Order item order id.
 * @apiSuccess   {Number}     order.orderItems.quantity             Order item quantity.
 * @apiSuccess   {String}     order.orderItems.name                 Order item name.
 * @apiSuccess   {String}     order.orderItems.description          Order item description.
 * @apiSuccess   {Number}     order.orderItems.price                Order item price.
 * @apiSuccess   {Number}     order.orderItems.feeds_min            Order item feed minimum.
 * @apiSuccess   {Number}     order.orderItems.feeds_max            Order item feed maximum.
 * @apiSuccess   {String}     order.orderItems.notes                Order item notes.
 * @apiSuccess   {String[]}   order.orderItems.options_sets         List of order item options.
 * @apiSuccess   {String}     order.orderItems.recipient            Order item recipient.
 * @apiSuccess   {Number}     order.orderItems.sub_total            Order item subtotal.
 * @apiSuccess   {Number}     order.orderItems.min_qty              Order item minimum quantity.

 * @apiSuccess   {Object}     order.user                            User on order.
 * @apiSuccess   {Number}     order.user.id                         User id.
 * @apiSuccess   {String}     order.user.created_at                 Timestamp when user account was created.
 * @apiSuccess   {String}     order.user.email                      User email.
 * @apiSuccess   {String}     order.user.password                   User password.
 * @apiSuccess   {String}     order.user.organization               User organization.
 * @apiSuccess   {String}     order.user.name                       User name.
 * @apiSuccess   {String}     order.user.balanced_customer_uri      User balanced customer uri.
 * @apiSuccess   {Boolean}    order.user.is_invoiced                "True" if account is invoiced.
 * @apiSuccess   {Number}     order.user.points                     User total reward points.
 * @apiSuccess   {Number}     order.user.region_id                  User region id.
 * @apiSuccess   {String}     order.user.default_zip                User default zipcode.
 * @apiSuccess   {String}     order.user.ordrin_email               *Obsolete crap*
 * @apiSuccess   {String}     order.user.ordrin_password            *Obsolete crap*
 * @apiSuccess   {Boolean}    order.user.is_tax_exempt              "True" if account is tax exempt.
 * @apiSuccess   {String}     order.user.user_agent                 User agent information.
 * @apiSuccess   {String}     order.user.organization_type          User organization type.
 * @apiSuccess   {String}     order.user.stripe_id                  User stripe id.
 * @apiSuccess   {Boolean}    order.user.is_deleted                 "True" if account is deactivated.
 * @apiSuccess   {Number}     order.user.priority_account_price_hike_percentage     Percentage on menu items for a priority account.

 * @apiSuccess   {Object[]}   order.user.addresses                  List of addresses available on user.
 * @apiSuccess   {Number}     order.user.addresses.id               Address id.
 * @apiSuccess   {Number}     order.user.addresses.user_id          Address user id.
 * @apiSuccess   {String}     order.user.addresses.name             Address name.
 * @apiSuccess   {String}     order.user.addresses.street           Address street.
 * @apiSuccess   {String}     order.user.addresses.city             Address city.
 * @apiSuccess   {String}     order.user.addresses.state            Address state.
 * @apiSuccess   {String}     order.user.addresses.zip              Address zipcode.
 * @apiSuccess   {Boolean}    order.user.addresses.is_default       "True" if address is default.
 * @apiSuccess   {String}     order.user.addresses.street2          Address street, second line.
 * @apiSuccess   {String}     order.user.addresses.phone            Address phone.
 * @apiSuccess   {String}     order.user.addresses.delivery_instructions     Address delivery instructions.
 * @apiSuccess   {String}     order.user.addresses.lat_lng          Latitude/longitude of address.

 * @apiSuccess   {Object[]}   order.user.payment_methods                List of payment methods on user.
 * @apiSuccess   {Number}     order.user.payment_methods.id             Payment method id.
 * @apiSuccess   {String}     order.user.payment_methods.created_at     Timestamp when created.
 * @apiSuccess   {String}     order.user.payment_methods.type           Payment method type.
 * @apiSuccess   {String}     order.user.payment_methods.uri            Payment method uri.
 * @apiSuccess   {String}     order.user.payment_methods.stripe_id      Payment method stripe id.
 * @apiSuccess   {String}     order.user.payment_methods.name           Payment method name.

 * @apiSuccess   {Object}     order.user.payment_methods.data                       Data on payment method.
 * @apiSuccess   {String}     order.user.payment_methods.data.id                    Payment id.
 * @apiSuccess   {String}     order.user.payment_methods.data.object                Payment object type.
 * @apiSuccess   {String}     order.user.payment_methods.data.last4                 Payment last 4 SSN.
 * @apiSuccess   {String}     order.user.payment_methods.data.brand                 Payment brand.
 * @apiSuccess   {String}     order.user.payment_methods.data.funding               Payment funding type.
 * @apiSuccess   {Number}     order.user.payment_methods.data.exp_month             Payment expiration month.
 * @apiSuccess   {Number}     order.user.payment_methods.data.exp_year              Payment expiration year.
 * @apiSuccess   {String}     order.user.payment_methods.data.fingerprint           Payment fingerprint token.
 * @apiSuccess   {String}     order.user.payment_methods.data.country               Payment country.
 * @apiSuccess   {String}     order.user.payment_methods.data.name                  Payment name.
 * @apiSuccess   {String}     order.user.payment_methods.data.address_line1         Payment address, line 1.
 * @apiSuccess   {String}     order.user.payment_methods.data.address_line2         Payment address, line 2.
 * @apiSuccess   {String}     order.user.payment_methods.data.address_city          Payment address city.
 * @apiSuccess   {String}     order.user.payment_methods.data.address_state         Payment address state.
 * @apiSuccess   {String}     order.user.payment_methods.data.address_zip           Payment address zipcode.
 * @apiSuccess   {String}     order.user.payment_methods.data.address_country       Payment address country.
 * @apiSuccess   {String}     order.user.payment_methods.data.cvc_check             Payment cvc check.
 * @apiSuccess   {String}     order.user.payment_methods.data.address_line1_check   Payment address, line 1 check.
 * @apiSuccess   {String}     order.user.payment_methods.data.address_zip_check     Payment address zipcode check.
 * @apiSuccess   {String}     order.user.payment_methods.data.dynamic_last4         Payment dynamic last 4 SSN.
 * @apiSuccess   {Object}     order.user.payment_methods.data.metadata              Payment metadata.
 * @apiSuccess   {String}     order.user.payment_methods.data.customer              Payment customer token.

 * @apiSuccess   {Object}     order.restaurant                           Restaurant on order.
 * @apiSuccess   {Number}     order.restaurant.id                        Restaurant id.
 * @apiSuccess   {String}     order.restaurant.created_at                Timestamp when restaurant was created.
 * @apiSuccess   {String}     order.restaurant.name                      Restaurant name.
 * @apiSuccess   {String}     order.restaurant.street                    Restaurant street.
 * @apiSuccess   {String}     order.restaurant.city                      Restaurant city.
 * @apiSuccess   {String}     order.restaurant.state                     Restaurant state.
 * @apiSuccess   {String}     order.restaurant.zip                       Restaurant zipcode.
 * @apiSuccess   {Number}     order.restaurant.minimum_order             Restaurant minimum order.
 * @apiSuccess   {Number}     order.restaurant.price                     Restaurant price index.
 * @apiSuccess   {String[]}   order.restaurant.cuisine                   List of restaurant cuisine types.
 * @apiSuccess   {Boolean}    order.restaurant.is_hidden                 "True" if restaurant is hidden.
 * @apiSuccess   {Number}     order.restaurant.address_id                Restaurant address id.
 * @apiSuccess   {String}     order.restaurant.logo_url                  Restaurant logo url.
 * @apiSuccess   {String}     order.restaurant.logo_mono_url             Restaurant logo mono url.
 * @apiSuccess   {String}     order.restaurant.street2                   Restaurant street, second line.
 * @apiSuccess   {String}     order.restaurant.delivery_instructions     Restaurant delivery instructions.
 * @apiSuccess   {String}     order.restaurant.balanced_customer_uri     Restaurant balanced customer uri.
 * @apiSuccess   {Number}     order.restaurant.payment_method_id         Restaurant payment method id.
 * @apiSuccess   {String}     order.restaurant.yelp_business_id          Restaurant yelp business id.
 * @apiSuccess   {String}     order.restaurant.description               Restaurant description.
 * @apiSuccess   {String[]}   order.restaurant.websites                  List of restaurant websites.
 * @apiSuccess   {String}     order.restaurant.display_phone             Restaurant display phone.
 * @apiSuccess   {String[]}   order.restaurant.emails                    List of restaurant emails.
 * @apiSuccess   {String[]}   order.restaurant.sms_phones                List of restaurant sms phones.
 * @apiSuccess   {String[]}   order.restaurant.voice_phones              List of restaurant voice phones.
 * @apiSuccess   {String}     order.restaurant.billing_email             Restaurant billing email.
 * @apiSuccess   {String}     order.restaurant.billing_street            Restaurant billing street address.
 * @apiSuccess   {String}     order.restaurant.billing_street2           Restaurant billing street address, second line.
 * @apiSuccess   {String}     order.restaurant.billing_city              Restaurant billing address city.
 * @apiSuccess   {String}     order.restaurant.billing_state             Restaurant billing address state.
 * @apiSuccess   {String}     order.restaurant.billing_zip               Restaurant billing address zipcode.
 * @apiSuccess   {Number}     order.restaurant.gb_fee                    Restaurant goodybag fee.
 * @apiSuccess   {Boolean}    order.restaurant.is_direct_deposit         "True" if restaurant uses direct deposit.
 * @apiSuccess   {Boolean}    order.restaurant.is_fee_on_total           *Obsolete crap*
 * @apiSuccess   {Number}     order.restaurant.region_id                 Restaurant region id.
 * @apiSuccess   {Number}     order.restaurant.delivery_service_order_amount_threshold     Restaurant delivery service order amount threshold.
 * @apiSuccess   {Number}     order.restaurant.delivery_service_head_count_threshold       Restaurant delivery service head count threshold.
 * @apiSuccess   {Number}     order.restaurant.delivery_service_order_total_upperbound     Restaurant delivery service order total upperbound.
 * @apiSuccess   {Boolean}    order.restaurant.disable_courier           "True" if courier disabled on restaurant.
 * @apiSuccess   {Number}     order.restaurant.pms_contact_id            Restaurant pms contact id.
 * @apiSuccess   {String}     order.restaurant.search_vector             Restaurant search vector.
 * @apiSuccess   {Boolean}    order.restaurant.has_contract              "True" if restaurant has contract.
 * @apiSuccess   {Number}     order.restaurant.no_contract_fee           Restaurant no contract fee.
 * @apiSuccess   {Number}     order.restaurant.plan_id                   Restaurant plan id.
 * @apiSuccess   {String}     order.restaurant.list_photo_url            Restaurant list photo url.
 * @apiSuccess   {String}     order.restaurant.text_id                   Restaurant text id.
 * @apiSuccess   {Boolean}    order.restaurant.disable_courier_notifications     "True" if courier notifications disabled on restaurant.
 * @apiSuccess   {Number}     order.restaurant.popularity                Restaurant popularity.
 * @apiSuccess   {Boolean}    order.restaurant.is_archived               "True" if restaurant is archived.
 * @apiSuccess   {Boolean}    order.restaurant.is_featured               "True" if restaurant is featured.
 * @apiSuccess   {String[]}   order.restaurant.supported_order_types     List of supported order types on restaurant.
 * @apiSuccess   {String}     order.restaurant.stripe_id                 Restaurant stripe id.
 * @apiSuccess   {String}     order.restaurant.uuid                      Restaurant uuid.
 * @apiSuccess   {Boolean}    order.restaurant.collect_payments          "True" if restaurant payments automatically transferred to Goodybag's Stripe account.
 * @apiSuccess   {Boolean}    order.restaurant.accepts_tips              "True" if restaurant accepts tips.
 * @apiSuccess   {String}     order.restaurant.delivery_service          Restaurant delivery service.

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

 * @apiSuccess   {Object}     order.restaurant.region                           Restaurant region.
 * @apiSuccess   {Number}     order.restaurant.region.id                        Region id.
 * @apiSuccess   {String}     order.restaurant.region.name                      Region name.
 * @apiSuccess   {String}     order.restaurant.region.state                     Region state.
 * @apiSuccess   {String[]}   order.restaurant.region.cities                    Region cities.
 * @apiSuccess   {String}     order.restaurant.region.timezone                  Region timezone.
 * @apiSuccess   {Number}     order.restaurant.region.sales_tax                 Region sales tax.
 * @apiSuccess   {String}     order.restaurant.region.lead_time_modifier        Region lead time modifier.
 * @apiSuccess   {Boolean}    order.restaurant.region.is_hidden                 "True" if region is hidden.
 * @apiSuccess   {Boolean}    order.restaurant.region.sorts_by_no_contract      "True" if region sorts by no contract.

 * @apiSuccess   {Object[]}   order.restaurant.delivery_times                   List of delivery times for restaurant.
 * @apiSuccess   {Number}     order.restaurant.delivery_times.id                Delivery time id.
 * @apiSuccess   {String}     order.restaurant.delivery_times.created_at        Timestamp when delivery time was created.
 * @apiSuccess   {Number}     order.restaurant.delivery_times.restaurant_id     Delivery time restaurant id.
 * @apiSuccess   {Number}     order.restaurant.delivery_times.day               Delivery time, day of the week.
 * @apiSuccess   {String}     order.restaurant.delivery_times.start_time        Delivery time, start.
 * @apiSuccess   {String}     order.restaurant.delivery_times.end_time          Delivery time, end.

 * @apiSuccess   {Object[]}   order.restaurant.delivery_zips                    List of delivery zipcodes available for restaurant.
 * @apiSuccess   {Number}     order.restaurant.delivery_zips.id                 Zipcode id.
 * @apiSuccess   {String}     order.restaurant.delivery_zips.created_at         Timestamp when zipcode was created.
 * @apiSuccess   {Number}     order.restaurant.delivery_zips.restaurant_id      Zipcode restaurant id.
 * @apiSuccess   {String}     order.restaurant.delivery_zips.zip                Zipcode.
 * @apiSuccess   {Number}     order.restaurant.delivery_zips.fee                Zipcode delivery fee.

 * @apiSuccess   {Object[]}   order.restaurant.lead_times                       List of lead times for restaurant.
 * @apiSuccess   {Number}     order.restaurant.lead_times.id                    Lead time id.
 * @apiSuccess   {String}     order.restaurant.lead_times.created_at            Timestamp when lead time was created.
 * @apiSuccess   {Number}     order.restaurant.lead_times.restaurant_id         Lead time restaurant id.
 * @apiSuccess   {Number}     order.restaurant.lead_times.max_guests            Lead time, max guests.
 * @apiSuccess   {Number}     order.restaurant.lead_times.lead_time             Lead time.
 * @apiSuccess   {Number}     order.restaurant.lead_times.cancel_time           Lead time, cancel time.

 * @apiSuccess   {Object[]}   order.restaurant.locations                        List of locations for restaurant.
 * @apiSuccess   {Number}     order.restaurant.locations.id                     Location id.
 * @apiSuccess   {Number}     order.restaurant.locations.restaurant_id          Location restaurant id.
 * @apiSuccess   {String}     order.restaurant.locations.name                   Location name.
 * @apiSuccess   {String}     order.restaurant.locations.street                 Location street.
 * @apiSuccess   {String}     order.restaurant.locations.street2                Location street, line 2.
 * @apiSuccess   {String}     order.restaurant.locations.city                   Location city.
 * @apiSuccess   {String}     order.restaurant.locations.state                  Location state.
 * @apiSuccess   {String}     order.restaurant.locations.zip                    Location zipcode.
 * @apiSuccess   {Boolean}    order.restaurant.locations.is_default             "True" if location is default for restaurant.
 * @apiSuccess   {String}     order.restaurant.locations.phone                  Location contact phone.
 * @apiSuccess   {Number}     order.restaurant.locations.price_per_mile         Location price per mile.
 * @apiSuccess   {Number}     order.restaurant.locations.base_delivery_fee      Location base delivery fee.
 * @apiSuccess   {String}     order.restaurant.locations.lat_lng                Location latitude/longitude.
 **/
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

/**
 * @api {get} /orders/:oid/delivery-fee     Returns the delivery fee for the order specified.
 * @apiParam {Number} oid                   Order id.
 * @apiName GetOrderDeliveryFee
 * @apiGroup Restaurant Orders
 * @apiPermission none

 * @apiSuccess   {Object}     delivery_fee                    Returned delivery fee.
 * @apiSuccess   {Object}     delivery_fee.distance           Delivery distance.
 * @apiSuccess   {String}     delivery_fee.distance.text      Delivery distance in text form.
 * @apiSuccess   {Number}     delivery_fee.distance.value     Delivery distance in value form.
 * @apiSuccess   {Object}     delivery_fee.duration           Delivery duration.
 * @apiSuccess   {String}     delivery_fee.duration.text      Delivery duration in text form.
 * @apiSuccess   {Number}     delivery_fee.duration.value     Delivery duration in value form.
 * @apiSuccess   {Number}     delivery_fee.pricePerMile       Delivery price per mile.
 * @apiSuccess   {Number}     delivery_fee.basePrice          Delivery base price.
 * @apiSuccess   {Number}     delivery_fee.price              Delivery price.
 **/
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

/**
 * @api {get} /orders/:oid/items     Returns all order items for the specified order.
 * @apiParam {Number} oid            Order id.
 * @apiName GetOrderItems
 * @apiGroup Restaurant Orders
 * @apiPermission admin order-owner order-editor

 * @apiSuccess   {Object[]}   order_items                   List of items on specified order.
 * @apiSuccess   {Number}     order_items.quantity          Order item quantity.
 * @apiSuccess   {Number}     order_items.price             Order item price.
 * @apiSuccess   {String[]}   order_items.options_sets      List of option sets on item.
 * @apiSuccess   {Number}     order_items.priority_account_price_hike_percentage     Percentage on menu items for a priority account.
 * @apiSuccess   {Number}     order_items.id                Order item id.
 * @apiSuccess   {String}     order_items.created_at        Timestamp when order item was created.
 * @apiSuccess   {Number}     order_items.item_id           Order item id.
 * @apiSuccess   {Number}     order_items.order_id          Order id.
 * @apiSuccess   {String}     order_items.name              Order item name.
 * @apiSuccess   {String}     order_items.description       Order item description.
 * @apiSuccess   {Number}     order_items.feeds_min         Order item feed minimum.
 * @apiSuccess   {Number}     order_items.feeds_max         Order item feed maximum.
 * @apiSuccess   {String}     order_items.notes             Order item notes.
 * @apiSuccess   {String}     order_items.recipient         Order item recipient.
 * @apiSuccess   {Number}     order_items.sub_total         Order item subtotal.
 * @apiSuccess   {Number}     order_items.min_qty           Order item minimum quantity.
 **/
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

route.post('/:oid/items'
, m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true
  })
  , m.editOrderAuth
  , m.restrict(['admin', 'order-owner', 'order-editor'])
  , controllers.orders.editability
  , controllers.orders.orderItems.add
);

route.post('/:order_id/generate_edit_token', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), controllers.orders.generateEditToken);

route.post('/:oid/rebuild-pdf/:type', m.restrict(['admin']), controllers.orders.rebuildPdf);

/**
 * @api {get} /orders/:oid/notifications     Returns all notifications available on the specified order.
 * @apiParam {Number} oid                    Order id.
 * @apiName GetOrderAvailableNotifications
 * @apiGroup Order Notifications
 * @apiPermission admin

 * @apiSuccess   {Object[]}   notifications                 List of all notifications available on the specified order.
 * @apiSuccess   {String}     notifications.type            Notification type.
 * @apiSuccess   {String}     notifications.id              Notification id.
 * @apiSuccess   {String}     notifications.name            Notification name.
 * @apiSuccess   {String}     notifications.description     Notification description.
 * @apiSuccess   {Number}     notifications.cid             Notification cid.
 * @apiSuccess   {String}     notifications.format          Notification format.

 * @apiSuccess   {Object}     notifications.email           Notification email.
 * @apiSuccess   {String}     notifications.email.to        Email to field.
 * @apiSuccess   {String}     notifications.email.from      Email from field.
 * @apiSuccess   {String}     notifications.email.subject   Email subject field.
 * @apiSuccess   {String}     notifications.email.html      Email html string.
 * @apiSuccess   {String}     notifications.email.url       Email url.
 **/
route.get('/:oid/notifications', m.restrict(['admin']), controllers.orders.notifications.JSON.list);

route.post('/:oid/notifications/:id', m.restrict(['admin']), controllers.orders.notifications.JSON.sendNotification);

/**
 * @api {get} /orders/:oid/notifications-history     Returns the notifications history for a specified order.
 * @apiParam {Number} oid                            Order id.
 * @apiName GetOrderNotificationsHistory
 * @apiGroup Order Notifications
 * @apiPermission admin

 * @apiSuccess   {Object[]}   notifications                   List of notifications sent for the specified order.
 * @apiSuccess   {Number}     notifications.id                Notification uniqe id.
 * @apiSuccess   {String}     notifications.nid               Notification id.
 * @apiSuccess   {String}     notifications.order_id          Notification order id.
 * @apiSuccess   {String}     notifications.send_date         Notification send date.
 * @apiSuccess   {String}     notifications.created_at        Timestamp when notification was created.
 * @apiSuccess   {String}     notifications.user_id           Notification user id.
 * @apiSuccess   {String}     notifications.data_html         Notification data html.
 * @apiSuccess   {String}     notifications.type              Notification type.
 * @apiSuccess   {String}     notifications.name              Notification name.
 * @apiSuccess   {String}     notifications.description       Notification description.
 * @apiSuccess   {Boolean}    notifications.disablePriceHike  "True" if price hike is disabled.
 * @apiSuccess   {Number}     notifications.cid               Notification cid.
 * @apiSuccess   {String}     notifications.format            Notification format.

 * @apiSuccess   {Object}     notifications.data          Data for notification.
 * @apiSuccess   {String[]}   notifications.data.to       To field.
 * @apiSuccess   {String}     notifications.data.from     From field.
 * @apiSuccess   {String}     notifications.data.subject  Subject field.
 * @apiSuccess   {String}     notifications.data.url      Data url.
 **/
route.get('/:oid/notifications-history', m.restrict(['admin']), controllers.orders.notifications.JSON.history);

/**
 * @api {get} /orders/:oid/notifications-history/:id     Returns the specified notification from the notifications history for a specified order.
 * @apiParam {Number} oid                                Order id.
 * @apiParam {Number} id                                 Notification unique id.
 * @apiName GetOrderNotificationsHistoryNotification
 * @apiGroup Order Notifications
 * @apiPermission admin

 * @apiSuccess   {Object}     notification                   Returned notification.
 * @apiSuccess   {Number}     notification.id                Notification uniqe id.
 * @apiSuccess   {String}     notification.nid               Notification id.
 * @apiSuccess   {String}     notification.order_id          Notification order id.
 * @apiSuccess   {String}     notification.send_date         Notification send date.
 * @apiSuccess   {String}     notification.created_at        Timestamp when notification was created.
 * @apiSuccess   {String}     notification.user_id           Notification user id.
 * @apiSuccess   {String}     notification.type              Notification type.
 * @apiSuccess   {String}     notification.name              Notification name.
 * @apiSuccess   {String}     notification.description       Notification description.
 * @apiSuccess   {Boolean}    notification.disablePriceHike  "True" if price hike is disabled.
 * @apiSuccess   {Number}     notification.cid               Notification cid.
 * @apiSuccess   {String}     notification.format            Notification format.

 * @apiSuccess   {Object}     notifications.data          Data for notification.
 * @apiSuccess   {String[]}   notifications.data.to       To field.
 * @apiSuccess   {String}     notifications.data.from     From field.
 * @apiSuccess   {String}     notifications.data.subject  Subject field.
 **/
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

/**
 * @api {get} /orders/:oid/amenities     Returns all amenities for a specified order.
 * @apiParam {Number} oid                Order id.
 * @apiName GetOrderAmenities
 * @apiGroup Order Amenities
 * @apiPermission admin

 * @apiSuccess   {Object[]}   amenities               List of amenities on the specified order.
 * @apiSuccess   {Number}     amenities.id            Amenity unique id.
 * @apiSuccess   {String}     amenities.created_at    Timestamp when amentiy was created.
 * @apiSuccess   {Number}     amenities.order_id      Amenity order id.
 * @apiSuccess   {Number}     amenities.amenity_id    Amenity id.
 **/
route.get('/:order_id/amenities', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.param('order_id'), m.find(db.order_amenities));

/**
 * @api {get} /orders/:oid/amenities/:id    Returns the order amenity specified.
 * @apiParam {Number} oid                   Order id.
 * @apiParam {Number} id                    Amenity id.
 * @apiName GetOrderAmenity
 * @apiGroup Order Amenities
 * @apiPermission admin order-owner

 * @apiSuccess   {Object[]}   amenities               List of amenities on the specified order.
 * @apiSuccess   {Number}     amenities.id            Amenity unique id.
 * @apiSuccess   {String}     amenities.created_at    Timestamp when amentiy was created.
 * @apiSuccess   {Number}     amenities.order_id      Amenity order id.
 * @apiSuccess   {Number}     amenities.amenity_id    Amenity id.
 **/
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

/**
 * Duplicate order
 */

route.post('/:oid/duplicates', m.restrict(['client', 'admin']), controllers.orders.duplicate);
