var server = require('express')();
var routes = require('./routes');

server.get(
  '/v1/restaurants'
, routes.list
);

server.get(
  '/v1/restaurants/:id'
, routes.get
);

module.exports = server;