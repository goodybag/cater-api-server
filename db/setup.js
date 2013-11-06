var tasks = require('./tasks');
var async = require('async');

var run = function() {
  var fns = ['destroyCreateDb', 'createExtensions', 'createTypes', 'createTables', 'loadFixtures', 'setLatestDelta'];

  // Run each task in series as defined by fns
  // Exit with 1 if there's an error, 0 if not
  async.series(
    fns.map( function( f ){
      return function( done ){ tasks[ f ].run( done ); }
    })
  , function( error, results ){
      if ( error ) console.log( error );
      process.exit( ~~!!error );
    }
  );
};

if (require.main === module) {
  run();
}
