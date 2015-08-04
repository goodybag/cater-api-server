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

var onAddress = function( progress, dal, address, callback ){
  progress.write('.');

  address = Addresses.create( address );

  var onError = function( error ){
    results.errors.push({
      address:  address
    , error:    error
    });

    progress.write('x');

    return callback();
  };

  var req = GeoCodeRequests.create()
    .address( address.toString({ street2: false }) )
    .send( function( error, res ){
      progress.moveCursor( -1, 0 );

      if ( error ){
        return onError( error );
      }

      if ( !res.isValidAddress() ){
        return onError({ name: 'INVALID_ADDRESS' });
      }

      var resAddress;

      try {
        resAddress = res.toAddress();
      } catch( e ){
        return onError( e );
      }

      progress.write('~');

      dal.update( address.id, { lat_lng: resAddress.lat_lng }, function( error ){
        progress.moveCursor( -1, 0 );

        if ( error ){
          return onError( error );
        }

        results.completed.push({
          address:  address
        });

        progress.write('✓');

        callback();
      });
    });
};

module.exports = function( options, callback ){
  options = utils.defaults( options || {}, {
    progress: process.stdout
  , logs: __dirname + '/log.json'
  });

  var progress  = options.progress;
  var logs      = fs.createWriteStream( options.logs );
  var where     = { lat_lng: { $null: true } };

  utils.async.parallel({
    locations:   db.restaurant_locations.find.bind( db.restaurant_locations,  where )
  , users:       db.addresses.find.bind( db.addresses, where )
  }, function( error, result ){
    if ( error ){
      return callback( error );
    }

    progress.write('\n\n');
    progress.write('Processing:\n');
    progress.write('  Locations: ' + result.locations.length + '\n');
    progress.write('  Users:     ' + result.users.length + '\n');
    progress.write('\n\n');

    utils.async.series([
      utils.async.eachSeries.bind(
        utils.async, result.locations, onAddress.bind( null, progress, db.restaurant_locations )
      )
    , utils.async.eachSeries.bind(
        utils.async, result.users, onAddress.bind( null, progress, db.addresses )
      )

    , function( next ){
        progress.write('\n\n');
        progress.write('Errors:    ' + results.errors.length + '\n');
        progress.write('Completed: ' + results.completed.length + '\n');
        progress.write('\n');

        logs.write( JSON.stringify( results, true, '  ' ) );
        logs.end( next );
      }
    ], callback );
  });
};

if ( require.main === module ){
  module.exports( require('minimist')( process.argv.slice(2) ), function ( error ){
    if ( error ) throw error;

    process.exit(1);
  });
}