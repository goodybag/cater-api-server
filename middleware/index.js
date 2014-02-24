module.exports = {
  cors: require('./cors')
, domains: require('./domains')
, uuid: require('./uuid')
, sslRedirect: require('./ssl-redirect')
, requestLogger: require('connect-request-logger-pg')
, getUser: require('./get-user')
, statusCodeIntercept: require('./status-code-intercept')
, setSession: require('./set-session')
};
