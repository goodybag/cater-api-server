var fs              = require('fs');
var db              = require('db');
var utils           = require('utils');
var config          = require('config');
var GeoCodeRequests = require('stamps/requests/geocode');
var Addresses       = require('stamps/addresses');

var results = {
  errors:     []
, completed:  []
};

var rate = 1000 / config.google.geocoding.limit.second;

module.exports = function( options, callback ){
  options = utils.defaults( options || {}, {
    progress: process.stdout
  , logs: __dirname + '/log.json'
  });

  var progress = options.progress;
  var logs      = fs.createWriteStream( options.logs );

  callback = callback || function(){};

  utils.async.waterfall([
    function( next ){
      db.restaurant_locations.find( {}, next );
    }

  , function( locations, next ){
      progress.write('\n\n');

      progress.write('Processing ' + locations.length + ' addresses');
      progress.write('\n');

      var onLocation = function( location, done ){
        progress.write('.');

        done = setTimeout.bind( null, done, rate );

        var address = Addresses.create( location );

        var req = GeoCodeRequests.create()
          .address( address.toString() )
          .send( function( error, res ){
            progress.moveCursor( -1, 0 );

            if ( error ){
              results.errors.push({
                address: address
              , error: error
              });

              progress.write('x');
            } else {
              results.completed.push({
                address:  address
              , valid:    res.isValidAddress()
              });

              progress.write('✓');

              done();
            }
          });
      };

      utils.async.eachSeries( locations, onLocation, next );
    }

  , function( next ){
      progress.write('\n\n');
      progress.write('Errors:    ' + results.errors.length + '\n');
      progress.write('Completed: ' + results.errors.completed + '\n');

      logs.write( JSON.stringify( results ) );
      logs.end( next );
    }
  ], callback );
};

if ( require.main === module ){
  module.exports()
}