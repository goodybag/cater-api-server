var server = require('express')();
var routes = require('./routes');

server.get(
  '/v1/users'
, routes.get
);

server.get(
  '/v1/users/:id'
, routes.get
);

module.exports = server;