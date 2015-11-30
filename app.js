
/**
 * Module dependencies.
 */

var
  config = require('./config')
, rollbar = require('rollbar')
, util = require('util')
, express = require('express')
, session = require('express-session')
, fs = require('fs')
, hbs = require('hbs')
, crypto = require('crypto')
, forky = require('forky')
, utils = require('./utils')
, routes = require('./routes')
, helpers = require('./helpers')
, partials = require('./lib/partials')
, errors = require('./errors')
, middleware = require('./middleware')
, Models = require('./models')
, pkg = require('./package.json')
, odsChecker = require('./public/js/lib/order-delivery-service-checker')
;

hbs.handlebars = require('handlebars');
var app = module.exports = express();

app.use( middleware.logger() );

// Intercept status codes and render HTML if necessary
app.use( middleware.statusCodeIntercept() );

// If our request times out, something must be wrong with
// our server. Likely caught in some impossible condition,
// so let's just kill the worker
app.use( middleware.timeout({ timeout: config.http.timeout }) );

app.use(require('serve-favicon')(__dirname + '/public/favicon.ico'));
app.use(require('compression')());
app.use((function(){
  var receiptReg = /receipts\/order\-\d+\.pdf/;

  // Exclude receipts from this static server so we can do ?rebuild=true for
  // receipts that exist in the local filesystem
  return function(req, res, next) {
    if (receiptReg.test(req.path)) return next();
    return express.static(__dirname + '/public')(req, res, next);
  };
})());

app.use( middleware.getUser2() );

app.use(require('body-parser').json({ limit: '200kb' }));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(middleware.methodOverride);
app.use(middleware.logRequest());

app.use(middleware.uuid());
app.use(middleware.domains);
app.use(middleware.cors);

app.use(middleware.setSession());
app.use(middleware.storeUserAgent());
app.use( middleware.getRegions() );
app.use( middleware.consumeNewSignup() );
app.use( middleware.rateLimit() );

app.use( middleware.setUserRegion() );

if (config.isProduction || config.isStaging) {
  app.use(middleware.sslRedirect);
}

app.use( require('dirac-middleware')({ envelope: false }) );
// app.use( require('./middleware/query-inspector')() );

app.use( function( req, res, next ){
  res.locals.reqQuery = req.query;
  return next();
});

// Re-register partials
if ( config.isDev ){
  app.use( function( req, res, next ){
    partials.register( hbs );
    return next();
  });
}

app.use( function( req, res, next ){
  if ( req.route && req.route.path ){
    req.logger.options.data.path = req.route.path;
  }
  next();
});

helpers.register(hbs);
partials.register(hbs);

routes.register(app);

if (config.rollbar) app.use(rollbar.errorHandler(config.rollbar.accessToken));

app.use( function logErrors( error, req, res, next ){
  req.logger.error({
    error:  error instanceof Error ? utils.extend( {}
            , errors.runtime.ERROR
            , { message: error.message, stack: error.stack }
            ) : error
  });

  return next( error );
});

app.use( function clientErrors( error, req, res, next ){
  if ( !req.xhr ){
    return next( error );
  }

  if ( 'httpCode' in error ){
    return res.error( error );
  }

  res.error( errors.internal.UNKNOWN, error );
});

if ( process.env.NODE_ENV === 'production' ){
  app.use( function renderErrors( error, req, res, next ){
    if ( res.headersSent ){
      return next( error );
    }

    if ( 'httpCode' in error ){
      res.status( error.httpCode );
    } else {
      res.status(500);
    }

    res.render( 'error', {
      error: error
    , layout: 'layout/default'
    });
  });
}

app.use( function devErrors( error, req, res, next ){
  // If instance of error, the default error handler will do just fine
  if ( error instanceof Error || res.headersSent ){
    return next( error );
  }

  try {
    res.json( JSON.stringify( error ) );
  } catch( e ) {
    res.send( util.inspect( error ) );
  }
});

app.use(require('@goodybag/scheduler-app')(config.postgresConnStr))

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
      config:   utils.extend({}, partialConfig, options.config, config)
    , session:  this.req.session
    , pkg:      pkg
    }
  );

  if (this.req.user && this.req.user.attributes && this.req.user.attributes.email) {
    options.intercom = !config.intercom.enabled ? false : {
      user_hash: crypto.createHmac('sha256', new Buffer(config.intercom.apiSecret, 'utf8')).update(this.req.user.attributes.email).digest('hex')
    };
  }

  render.call(this, path, options, callback);
}

/**
 * More readable app.all implementation for applying multiple
 * middlewares to a group of routes
 *
 * app.before( m.restrict(), function(){
 *   app.get('/orders', ... );
 *   app.get('/orders/:id', ... );
 *   ...
 * })
 */
app.before = function(){
  var args    = Array.prototype.slice.call( arguments );
  var handler = args.pop();
  var handle  = function( verb, path ){
    var _args = [ path ].concat( args, Array.prototype.slice.call( arguments, 2 ) );
    return this[ verb ].apply( this, _args );
  };

  handler({
    get:    handle.bind( app, 'get' )
  , post:   handle.bind( app, 'post' )
  , put:    handle.bind( app, 'put' )
  , patch:  handle.bind( app, 'patch' )
  , delete: handle.bind( app, 'delete' )
  , all:    handle.bind( app, 'all' )
  })
};

utils.overload.config({ dataTypes: Models });
