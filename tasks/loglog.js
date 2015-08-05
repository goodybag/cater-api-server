if ( process.env.GB_ENV === 'dev' ) {
  var grunt   = require('grunt');
  var server  = require('loglog-server');
  var config  = require('../config');

  module.exports = function( grunt ){
    grunt.registerTask( 'loglog', 'Starts our loglog server', function(){
      var done = this.async();

      if ( !config.logging.transports.mongo ){
        grunt.log.warn('MongoDB disabled as trasnport. Exiting.');
        done();
      }

      server.set( 'source', server.sources.mongodb({
        connection: config.logging.mongoConnStr
      , collection: config.logging.mongoCollection
      }));

      server.set( 'url', config.logging.url );
      server.listen( config.logging.httpPort, done );
    });
  };
}