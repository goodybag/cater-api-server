var fs      = require('fs');
var path    = require('path');
var pgdelta = require('pg-delta');
var config  = require('../../config');

module.exports.run = function( callback ){
  console.log("");
  console.log("#####################################");
  console.log("#  Running Deltas up in the hizzzy  #");
  console.log("#  -------------------------------  #");
  console.log("#    BE ON THE LOOKOUT FOR BEARS    #");
  console.log("#####################################");
  console.log("");

  pgdelta.run({
    deltasDir: path.join( __dirname, '../deltas' )
  , connectionParameters: config.postgresConnStr
  }, callback );
};

if (require.main === module) {
  cli = true;
  module.exports.run( function( error ){
    if ( error ) throw error;
    process.exit(0);
  });
}