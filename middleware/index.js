var utils = require('utils');
module.exports = utils.extend(
  {}
, require('stdm')
, require('dirac-middleware')
, require('./util')
, { after: require('./after')
  , aliasLocals: require('./alias-locals')
  , analytics: require('./analytics')
  , audit: require('./audit')
  , basicAuth: require('./basic-session-auth')
  , consumeNewSignup: require('./consume-new-signup')
  , cors: require('./cors')
  , csv: require('./csv')
  , defaultLocals: require('./default-locals')
  , defaultPeriod: require('./default-period')
  , deliveryServiceAuth: require('./delivery-service-auth')
  , domains: require('./domains')
  , editOrderAuth: require('./edit-order-auth')
  , enums: require('./enums')
  , exists: require('./exists')
  , filterBody: require('./filter-body')
  , filters: require('./filters')
  , findRegions: require('./find-regions')
  , getInvoices: require('./get-invoices')
  , getOrder: require('./get-order')
  , getOrder2: require('./get-order2')
  , getOrders: require('./get-orders')
  , getRegions: require('./get-regions')
  , getRestaurant: require('./get-restaurant')
  , getRestaurants: require('./get-restaurants')
  , getUser: require('./get-user')
  , getUser2: require('./get-user2')
  , jsonLocals: require('./json-locals')
  , localCookies: require('./local-cookies')
  , logRequest: require('./log-request')
  , methodOverride: require('./method-override')
  , noop: require('./noop')
  , orderAnalytics: require('./order-analytics')
  , orderEditable: require('./order-editable')
  , orderParams: require('./order-params')
  , organizationSubmissions: require('./organization-submissions')
  , owner: require('./owner')
  , param: require('./param')
  , queryParams: require('./query-params')
  , queryString: require('./query-string')
  , restaurant: require('./restaurant')
  , restrict: require('./restrict')
  , searchTags: require('./search-tags')
  , setSession: require('./set-session')
  , sslRedirect: require('./ssl-redirect')
  , states: require('./states')
  , statusCodeIntercept: require('./status-code-intercept')
  , stripe: require('./stripe')
  , uuid: require('./uuid')
  , s3: require('./s3')
  , db: require('./db')
  , profile: require('./profile')
  , getGeoFromIp: require('./get-geo-from-ip')
  , redirect: require('./redirect')
  , validateAddress: require('./validate-address')
  , viewPlugin: require('./view-plugin')
  , pagination: require('./pagination')
  , queryOptions: require('./query-options')
  , json: require('./json')
  , logger: require('./logger')
  , logger: require('./logger')
  , sessionAndUser: require('../lib/session-and-user')
  , setUserRegion: require('./set-user-region')
  , storeUserAgent: require('./store-user-agent')
  , timeout: require('./timeout')
  , userViewedEvent: require('./user-viewed-event')
  , updateStripeCustomer: require('./update-stripe-customer')
  }
);
