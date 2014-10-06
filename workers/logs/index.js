var server = require('loglog-server');
var config = require('../../config');

server.set( 'source', server.sources.mongodb({
  connection: config.logging.mongoConnStr
, collection: config.logging.mongoCollection
}));

server.set( 'url', config.logging.url );

server.listen( config.logging.httpPort );