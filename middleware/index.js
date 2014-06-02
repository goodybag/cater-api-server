module.exports = {
  after: require('./after')
, analytics: require('./analytics')
, basicAuth: require('./basic-session-auth')
, cors: require('./cors')
, defaultLocals: require('./default-locals')
, domains: require('./domains')
, editOrderAuth: require('./edit-order-auth')
, enums: require('./enums')
, exists: require('./exists')
, filterBody: require('./filter-body')
, getOrder: require('./get-order')
, getUser: require('./get-user')
, orderParams: require('./order-params')
, owner: require('./owner')
, queryParams: require('./query-params')
, queryString: require('./query-string')
, requestLogger: require('connect-request-logger-pg')
, restaurant: require('./restaurant')
, restrict: require('./restrict')
, setSession: require('./set-session')
, sslRedirect: require('./ssl-redirect')
, states: require('./states')
, statusCodeIntercept: require('./status-code-intercept')
, uuid: require('./uuid')
, s3: require('./s3')
, db: require('./db')
, profile: require('./profile')
, getGeoFromIp: require('./get-geo-from-ip')
};
