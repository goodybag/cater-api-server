var config  = require('./config');

// they recommend newrelic require to be at the top of the file
if ( config.isProduction ){
  require('newrelic');
}

var cluster = require('cluster');
var forky   = require('forky');
var rollbar = require('rollbar');

require('./db/cache').autoFetchFromRedis( require('./db') );

process.on('uncaughtException', function(err) {
  console.log('Uncaught Exception', err, err.stack);
  forky.disconnect();
});

process.on('unhandledRejection', function(err) {
  console.log('Unhandled Rejection', err, err.stack);
  forky.disconnect();
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

cluster.once( 'disconnect', function(){
  // Timeout until we forcefully exit the process
  var exitTimeout = setTimeout( process.exit.bind( process ), 10000 );

  server.close( function(){
    clearTimeout( exitTimeout );
    process.exit();
  });
});

module.exports = server;