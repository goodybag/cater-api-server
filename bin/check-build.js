#!/usr/bin/env node

var proc    = require('child_process');
var config  = require('../config');

if ( !config.isProduction ) return process.exit( 0 );

proc.spawn('./node_modules/grunt-cli/bin/grunt', ['build']).stdout.pipe( process.stdout );