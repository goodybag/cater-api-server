
/**
 * Module dependencies.
 */

var
  express = require('express')
, http = require('http')
, utils = require('./utils')
;

var middleware = {
  cors: require('./middleware/cors')
, domains: require('./middleware/domains')
, uuid: require('./middleware/uuid')
};

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));

  //JSON-ify the body incase the content is not JSON. We only work w/json
  app.use(middleware.jsonify);

  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(middleware.uuid());
  app.use(middleware.domains);
  app.use(middleware.cors);
  app.use(app.router);

  /**
   * Request & Response prototype updates
   */
  app.response.error = function(error, details) {
    utils.sendError(this, error, details);
  };
  app.response.noContent = function() {
    this.status(204).send('{}');
  };
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.use(require('./collections/users/server'));

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});