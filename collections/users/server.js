var server = require('express')();
var routes = require('./routes');

server.get(
  '/v1/users'
, routes.list
);

server.post(
  '/v1/users'
, routes.create
);

server.get(
  '/v1/users/:id'
, routes.get
);

module.exports = server;