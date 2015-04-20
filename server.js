var config  = require('./config');

var forky   = require('forky');
var rollbar = require('rollbar');

process.on('uncaughtException', function(err) {
  console.log('Uncaught Exception', err, err.stack);
  forky.disconnect();
  process.exit();
});

process.on('unhandledRejection', function(err) {
  console.log('Unhandled Rejection', err, err.stack);
  forky.disconnect();
  process.exit();
});

if (config.rollbar) {
  rollbar.init(config.rollbar.accessToken, {environment: config.env});
  rollbar.handleUncaughtExceptions();
}

var app = require('./app')
  , http = require('http');

require('./lib/events');
require('./lib/order-notifications');

var server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

module.exports = server;