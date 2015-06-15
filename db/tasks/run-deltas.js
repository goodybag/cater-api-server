var
  async     = require('async')
, fs        = require('fs')
, path      = require('path')
, spawn     = require('child_process').spawn
, semver    = require('semver')
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
    // sort results by semver
    results.sort(function (a, b) {
      // default sort is lexicographically, we need to sort by semver
      // strip off the '.sql'
      a = a.slice(0, -4);
      b = b.slice(0, -4);
      return semver.compare(a,b);
    });

    var max = '0.0.0';
    if (results.length) max = results[results.length-1].slice(0, -4);

    // Get file paths of deltas not already run, sort, log
    var deltas = fs.readdirSync(
      path.join( __dirname, options.deltasDir )
    ).filter( function( file ){
      return (
        fs.statSync( path.join( __dirname, options.deltasDir, file ) ).isFile() &&
        file.slice( -4 ) === '.sql'
      );
    }).filter( function( file ) {
      // reject deltas lower than max
      return semver.gt(file.slice(0, -4), max);
    }).filter( function( file ){
      // Reject files that have already been run
      return results.indexOf( file ) === -1;
    }).sort(function (a, b) {
        // default sort is lexicographically, we need to sort by semver

        // strip off the '.sql'
        a = a.slice(0, -4);
        b = b.slice(0, -4);

        return semver.compare(a,b);
    });

    if ( deltas.length == 0 ) return callback();

    async.mapSeries(deltas,function( f, cb ){
      var delta = fs.readFileSync( path.join( __dirname, options.deltasDir, f ) ).toString();
      var deltaName = f.slice(0, -4);
      var cwd = __dirname+'/../../bin/deltas/'+deltaName;

      async.series(
        [
          // run pre script if necessary
          function( cbSeries ){
            if (!fs.existsSync(cwd+'/pre.js')) return cbSeries(null);
            console.log( deltaName+ ' - running pre script');
            var pre = spawn( 'node', ['pre.js'], {cwd: cwd} );
            pre.on( 'close', function( code ){
              if ( code !=0 ) return cbSeries(new Error ('error running pre script for ' + deltaName + ' exit code: ' + code));
              cbSeries( null );
            });
          }
          // run delta
        , function( cbSeries ){
            console.log( deltaName+ ' - running SQL');
            db.query( delta, function( error ){
              return cbSeries( error );
            });
          }
          // run post script if necessary
        , function( cbSeries ){
            if (!fs.existsSync(cwd+'/post.js')) return cbSeries(null);
            console.log( deltaName+ ' - running post script');
            var post = spawn( 'node', ['post.js'], {cwd: cwd} );
            post.on( 'close', function( code ){
              if ( code !=0 ) return cbSeries(new Error ('error running post script for ' + deltaName + ' exit code: ' + code));
              return cbSeries(null);
            });
          }
        ]
      , cb
      );
    }, callback);
  });
};

if (require.main === module) {
  cli = true;
  module.exports.run();
}