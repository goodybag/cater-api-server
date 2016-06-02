'use strict';

var fs              = require('fs');
var db              = require('../../db');
var utils           = require('../../utils');
var config          = require('../../config');
var GeoCodeRequests = require('stamps/requests/geocode');
var Addresses       = require('stamps/addresses');
var logger          = require('../../lib/logger').create('Worker-UpdateAddressContent');
var EnumStream      = require('../../lib/enum-stream');

var errorLog = fs.createWriteStream( __dirname + '/errors.json' );
var isFirstError = true;

errorLog.write('[');

db.addresses.findStream( {}, { limit: 'all' }, function( error, stream ){
  if ( error ){
    throw error;
  }

  EnumStream
    .create( stream, { concurrency: 10 } )
    .mapAsync( ( address, next )=>{
      var stringAddress = Addresses.create( address ).toString({ street2: false });

      GeoCodeRequests.create()
        .address( stringAddress )
        .send( function( error, res ){
          if ( error ){
            error.address_id = address.id;
            error.address = stringAddress;
            return next( error );
          }

          if ( !res.isValidAddress() ){
            return next({
              name: 'INVALID_ADDRESS'
            , address_id: address.id
            , address: stringAddress
            });
          }

          var resAddress;

          try {
            resAddress = res.toAddress();
          } catch( e ){
            let error = utils.pick( e, 'message' );
            error.address_id = address.id;
            error.address = stringAddress;
            return next( error );
          }

          resAddress.id = address.id;

          next( null, resAddress );
        });
    })
    .mapAsync( ( address, next )=>{
      db.addresses.update( address.id, address, function( error ){
        if ( error ){
          error.address_id = address.id;
        }

        return next( error, address );
      });
    })
    .errors( ( error )=>{
      process.stdout.write('x');
      try {
        errorLog.write( JSON.stringify( error ) + ',\n' );
      } catch ( e ){
        // Oh well
      }
    })
    .forEach( ( data )=>{
      process.stdout.write('.');
    })
    .end( ()=>{
      errorLog.end(']', function(){
        process.exit(0);
      });
    });
});
