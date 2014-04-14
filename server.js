var fs      = require('fs');
var path    = require('path');
var forky   = require('forky');
var config  = require('./config');
var rollbar = require('rollbar');

process.on('uncaughtException', function(err) {
  console.log('Uncaught Exception', err, err.stack);
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

// Require all order notification definitions
var dir = path.resolve( __dirname, './lib/order-notifications' );
fs.readdirSync( dir ).filter( function( f ){
  return fs.statSync( path.join( dir, f ) ).isFile();
}).filter( function( f ){
  return f.slice(-3) === '.js';
}).forEach( function( f ){
  require( path.join( dir, f ) );
});

var server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

module.exports = server;