
/**
 * Module dependencies.
 */

var
  config = require('./config')
, express = require('express')
, hbs = require('hbs')
, utils = require('./utils')
, routes = require('./routes')
, helpers = require('./helpers')
;

var middleware = {
  cors: require('./middleware/cors')
, domains: require('./middleware/domains')
, uuid: require('./middleware/uuid')
};

var app = module.exports = express();

app.configure(function(){
  app.set('port', config.http.port || 3000);
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

  var render = app.response.render;
  app.response.render = function(path, options, callback) {
    var options = utils.extend(options || {}, {user: utils.extend(this.req.session.user, options.user)});
    render.call(this, path, options, callback);
  }

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

helpers.register(hbs);
hbs.registerPartials('./public/partials');
routes.register(app);
