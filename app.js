
/**
 * Module dependencies.
 */

var
  config = require('./config')
, rollbar = require('rollbar')
, express = require('express')
, session = require('express-session')
, RedisStore = require('connect-redis')( session )
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
console.log(config.session);
var app = module.exports = express();

app.configure(function(){
  app.use( middleware.logger() );

  // Intercept status codes and render HTML if necessary
  app.use( middleware.statusCodeIntercept() );

  // If our request times out, something must be wrong with
  // our server. Likely caught in some impossible condition,
  // so let's just kill the worker
  app.use( middleware.timeout() );

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


  app.use(express.cookieParser( config.session.secret ) );
  app.use( session({
    store:              new RedisStore( config.session.store )
  , secret:             config.session.secret
  , resave:             config.session.resave
  , saveUninitialized:  config.session.saveUninitialized
  }));

  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(middleware.logRequest());

  app.use(middleware.uuid());
  app.use(middleware.domains);
  app.use(middleware.cors);

  app.use(middleware.setSession());
  app.use(middleware.getUser);
  app.use(middleware.storeUserAgent());
  app.use( middleware.getRegions() )

  if (config.isProduction || config.isStaging) {
    app.use(middleware.sslRedirect);
  }

  app.use( require('dirac-middleware')({ envelope: false }) );
  // app.use( m.queryInspector() );

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

  app.use(app.router);
  app.use( function( req, res, next ){
    if ( req.route && req.route.path ){
      req.logger.options.data.path = req.route.path;
    }
    next();
  });

  if (config.rollbar) app.use(rollbar.errorHandler(config.rollbar.accessToken));

  app.use(function(err, req, res, next){
    console.error(err);
    req.logger.error(err instanceof Error ? err.toString() : err);
    res.error(errors.internal.UNKNOWN, err);

    // If the response stream does not close/finish in 2 seconds, just die anyway
    forky.disconnect(2000);
    res.on( 'finish', process.exit.bind( process ) );
    res.on( 'close', process.exit.bind( process ) );
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
        config:   utils.extend({}, partialConfig, options.config, config)
      , session:  this.req.session
      , pkg:      pkg
      }
    );

    if (this.req.user && this.req.user.attributes && this.req.user.attributes.email) {
      options.intercom = {
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
    , del:    handle.bind( app, 'del' )
    , all:    handle.bind( app, 'all' )
    })
  };
});

helpers.register(hbs);
partials.register(hbs);

routes.register(app);

utils.overload.config({ dataTypes: Models });
