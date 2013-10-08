var
  async     = require('async')
, fs        = require('fs')
, path      = require('path')
, utils     = require('../utils')
, config    = require('../../config')
, db        = require('../')

, options   = {
    deltasDir: '../deltas'
  }
;

module.exports.run = function( callback ){
  if ( config.env != 'dev' ) return callback();

  console.log("");
  console.log("######################################");
  console.log("#  Running Deltas up in the hizzzy  #");
  console.log("#  -------------------------------  #");
  console.log("#    BE ON THE LOOKOUT FOR BEARS    #");
  console.log("######################################");
  console.log("");

  // Get file paths of deltas, sort, then get the contents
  var deltas = fs.readdirSync(
    path.join( __dirname, options.deltasDir )
  ).filter( function( file ){
    console.log('  * ' + file);

    return (
      fs.statSync( path.join( __dirname, options.deltasDir, file ) ).isFile() &&
      file.slice( -4 ) === '.sql'
    );
  }).sort().map( function( file ){
    return fs.readFileSync( path.join( __dirname, options.deltasDir, file ) ).toString();
  });

  async.series(
    deltas.map( function( delta ){
      return function( done ){ db.query( delta, done ); }
    })
  , callback
  );
};
