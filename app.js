
/**
 * Module dependencies.
 */

var
  express = require('express')
, http = require('http')
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
  var dec = pennies % 100;
  var whole = Math.floor(pennies / 100);
  var decStr = '' + dec;
  return whole + '.' + decStr + ( decStr.length < 2 ? '0' : '');
});

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));

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

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
