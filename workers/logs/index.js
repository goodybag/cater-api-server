var server = require('loglog-server');
var config = require('../../config');

if ( !config.logging.transports.mongo ){
  console.warn('MongoDB disabled as trasnport. Exiting.');
  process.exit(0);
}

server.set( 'source', server.sources.mongodb({
  connection: config.logging.mongoConnStr
, collection: config.logging.mongoCollection
}));

server.set( 'url', config.logging.url );

server.listen( config.logging.httpPort );