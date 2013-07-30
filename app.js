
/**
 * Module dependencies.
 */

var
  express = require('express')
, http = require('http')
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
  app.use(function(req, res, next){
    if (!req.header('Content-Type') || req.header('Content-Type') == 'text/html'|| req.header('Content-Type') == 'text/plain'){
      req.headers['Content-Type'] = 'application/json';
      if (typeof req.body == 'string') req.body = JSON.parse(req.body);
    }
    res.header('Content-Type', 'application/json');
    next();
  });

  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(middleware.uuid());
  app.use(middleware.domains);
  app.use(middleware.cors);
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.use(require('./collections/users/server'));

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
