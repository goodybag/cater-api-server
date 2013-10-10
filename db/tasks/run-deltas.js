var
  async     = require('async')
, fs        = require('fs')
, path      = require('path')
, utils     = require('../utils')
, config    = require('../../config')
, db        = require('../')

, options   = {
    deltasDir: '../deltas'
  , deltasQuery: 'select * from deltas'
  }

, tableExists = function( table, callback ){
    var query = 'SELECT * FROM pg_catalog.pg_tables where tablename = $1';

    db.query( query, [ table ], function( error, results ){
      if ( error ) return callback( error );
      callback( null, results.length > 0 );
    });
  }
;

module.exports.run = function( callback ){
  console.log("");
  console.log("#####################################");
  console.log("#  Running Deltas up in the hizzzy  #");
  console.log("#  -------------------------------  #");
  console.log("#    BE ON THE LOOKOUT FOR BEARS    #");
  console.log("#####################################");
  console.log("");

  (function( done ){
    tableExists( 'deltas', function( error, exists ){
      if ( error ) return callback( error );

      // No deltas exist, no need to query deltas to find which ones to run
      if ( !exists ) return done( [] );

      // Get the deltas that have already been run
      db.query( options.deltasQuery, function( error, results ){
        if ( error ) return callback( error );

        // Get results in filename format for easier workin' with
        results = results.map( function( r ){
          return r.version + '.sql';
        });

        done( results );
      });
    });

  // Results represents the deltas already run
  })(function( results ){
    // Get file paths of deltas not already run, sort, log
    var deltas = fs.readdirSync(
      path.join( __dirname, options.deltasDir )
    ).filter( function( file ){
      return (
        fs.statSync( path.join( __dirname, options.deltasDir, file ) ).isFile() &&
        file.slice( -4 ) === '.sql'
      );
    }).filter( function( file ){
      // Reject files that have already been run
      return results.indexOf( file ) === -1;
    }).sort();

    // Log our batch
    deltas.forEach( function( f ){
      console.log('  * ' + f);
    });

    // Get file contents
    deltas = deltas.map( function( file ){
      return fs.readFileSync( path.join( __dirname, options.deltasDir, file ) ).toString();
    });

    async.series(
      deltas.map( function( delta ){
        return function( done ){ db.query( delta, done ); }
      })
    , callback
    );
  });
};
