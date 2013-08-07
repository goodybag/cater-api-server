
/**
 * Module dependencies.
 */

var
  express = require('express')
, hbs = require('hbs')
, utils = require('./utils')
, routes = require('./routes')
;

var middleware = {
  cors: require('./middleware/cors')
, domains: require('./middleware/domains')
, uuid: require('./middleware/uuid')
};

hbs.registerHelper('dollars', function(pennies, options) {
  if (typeof(pennies) === 'string') { pennies = options.contexts[0].get(pennies); }
  return (pennies / 100).toFixed(2);
});

hbs.registerHelper('statusLabel', function(status) {
  if (!status) return 'label-default';
  return 'label-' + {
    canceled: 'danger',
    pending: 'info',
    submitted: 'info',
    denied: 'danger',
    accepted: 'info',
    delivered: 'success'
  }[status];
});

var app = module.exports = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.compress());

  app.use(express.cookieParser('WOOT THE FUCK'));
  app.use(express.cookieSession());

  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(middleware.uuid());
  app.use(middleware.domains);
  app.use(middleware.cors);
  app.use(app.router);

  app.set('view engine', 'hbs');

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
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

//app.use(require('./collections/users/server'));

routes.register(app);
