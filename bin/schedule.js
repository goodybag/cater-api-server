#!/usr/bin/env node

var scheduler = require('../lib/scheduler');
var options = {};

var action = process.argv[2];

process.argv.slice(3).forEach( function( arg, i ){
  if ( arg.substring( 0, 2 ) === '--' ){
    options[ arg.substring( 2 ) ] = process.argv[ i + 3 + 1 ];
  }
});

scheduler.enqueue( action, 'now()', options );