#!/usr/bin/env node

process.env['GB_ENV'] = 'test';

var app = require('../app');
var http = require('http');

require('../lib/events');
require('../lib/order-notifications');

var server = http.createServer( app );

server.listen( app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});