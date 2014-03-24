#!/usr/bin/env node

process.env['GB_ENV'] = 'test';

var path      = require('path');
var proc      = require('child_process');
var config    = require('../config');
var utils     = require('../utils');
var setupDb   = require('../db/setup');
var fixtures  = require('../db/tasks/load-fixtures');

var fixUsers = function( callback ){
  var fixScript = proc.spawn( path.join( __dirname, './local-restore/fix-users' ) );
  fixScript.stdout.pipe( process.stdout );
  fixScript.stderr.pipe( process.stderr );

  fixScript.on( 'error', callback );
  fixScript.on( 'close', callback );
};

var fakeData = function( callback ){
  var fake = proc.spawn( 'node', [ path.join( __dirname, '../db/fake-data' ) ] );
  fake.stdout.pipe( process.stdout );
  fake.stderr.pipe( process.stderr );

  fake.on( 'error', callback );
  fake.on( 'close', callback );
};

var startServer = function( callback ){
  var app = require('../app');
  var http = require('http');

  require('../lib/events');

  var server = http.createServer( app );

  server.listen( app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
    if ( callback ) return callback();
  });
};

var stopServer = function( callback ){
  server.close( callback );
};

var runTests = function( callback ){
  var args = ['test'].concat( process.argv.slice(2) );
  var casper = proc.spawn( 'casperjs', args );

  casper.stdout.pipe( process.stdout );
  casper.stderr.pipe( process.stderr );

  casper.on( 'error', callback );
  casper.on( 'close', callback );
};

utils.async.series([
  setupDb
, fakeData
, fixUsers
, startServer
, runTests
], function( error ){
  if ( error ) throw error;

  process.exit(0);
});