var config = require('./config');
var rollbar = require('rollbar');

process.on('uncaughtException', function(err) {
  console.error('Caught exception:', err);
});

if (config.rollbar) {
  rollbar.init(config.rollbar.accessToken, {environment: config.env});
  rollbar.handleUncaughtExceptions();
}


var app = require('./app')
  , http = require('http');

require('./lib/events');

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

