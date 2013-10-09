#!/usr/bin/env node

/**
 * Replace this with grunt at some point
 */

var path = require('path');
var tasks = require(__dirname + '/../db/tasks');
var task = process.argv[ 2 ];

if ( !tasks[ task ] ) throw new Error('Cannot find task `' + task + '`');

tasks[ task ].run( function( error ){
  if ( error ) console.log( error );
  process.exit( ~~!!error );
});