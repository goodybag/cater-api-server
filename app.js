
/**
 * Module dependencies.
 */

var
  config = require('./config')
, rollbar = require('rollbar')
, express = require('express')
, fs = require('fs')
, hbs = require('hbs')
, crypto = require('crypto')
, forky = require('forky')
, utils = require('./utils')
, logger = require('./logger')
, routes = require('./routes')
, helpers = require('./helpers')
, partials = require('./lib/partials')
, errors = require('./errors')
;

var middleware = {
  cors: require('./middleware/cors')
, domains: require('./middleware/domains')
, uuid: require('./middleware/uuid')
, sslRedirect: require('./middleware/ssl-redirect')
, requestLogger: require('connect-request-logger-pg')
, getUser: require('./middleware/get-user')
, statusCodeIntercept: require('./middleware/status-code-intercept')
};

var app = module.exports = express();

app.configure(function(){
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.compress());
  app.use((function(){
    var receiptReg = /receipts\/order\-\d+\.pdf/;

    // Exclude receipts from this static server so we can do ?rebuild=true for
    // receipts that exist in the local filesystem
    return function(req, res, next) {
      if (receiptReg.test(req.path)) return next();
      return express.static(__dirname + '/public')(req, res, next);
    };
  })());

  app.use(logger.expressError);
  app.use(express.cookieParser('WOOT THE FUCK'));
  app.use(express.cookieSession());

  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());

  app.use(middleware.uuid());
  app.use(middleware.domains);
  app.use(middleware.cors);

  app.use(middleware.getUser);

  app.use(middleware.requestLogger({
    connStr: config.requestLogger.connStr
  , table: config.requestLogger.table
  , plan: config.requestLogger.plan
  , customFields: {uuid: 'uuid'}
  }));

  // Intercept status codes and render HTML if necessary
  app.use( middleware.statusCodeIntercept() );

  if (config.isProduction) {
    app.use(middleware.sslRedirect);
  }

  app.use( require('dirac-middleware')({ envelope: false }) );

  app.use(app.router);

  if (config.rollbar) app.use(rollbar.errorHandler(config.rollbar.accesToken));

  app.use(function(err, req, res, next){
    forky.disconnect();
    res.error(errors.internal.UNKNOWN, err);
  });

  app.set('view engine', 'hbs');
  app.set('port', config.http.port || 3000);

  /**
   * Request & Response prototype updates
   */
  app.response.error = function(error, details, callback) {
    utils.sendError(this, error, details);
    if (callback) callback(error);
  };
  app.response.noContent = function() {
    this.status(204).send('{}');
  };

  var render = app.response.render;
  app.response.render = function(path, options, callback) {
    var partialConfig = { intercomAppId: config.intercom.appId, phone: config.phone, emails: config.emails };

    options = options || {};

    options = utils.extend( options, {
        user:     utils.extend({}, this.req.session ? this.req.session.user : {}, options.user)
      , config:   utils.extend({}, partialConfig, options.config, config)
      , session:  this.req.session
      }
    );

    if (options.user.email) {
      options.intercom = {
        user_hash: crypto.createHmac('sha256', new Buffer(config.intercom.apiSecret, 'utf8')).update(options.user.email).digest('hex')
      };
    }

    render.call(this, path, options, callback);
  }

});

helpers.register(hbs);
partials.register(hbs);

routes.register(app);