var assert      = require('assert');
var config      = require('../../../config');
var db          = require('../../../db');
var DMReq       = require('stamps/requests/distance-matrix');

describe('Stamps', function(){
  describe('Requests', function(){
    describe('Distance Matrix', function(){
      [ { origins: ['Austin, TX']
        , destinations: ['Dallas, TX']
        , expected: [
            { elements: [ { distance: { text: '195 mi', value: 314413 }
            , duration: { text: '2 hours 56 mins', value: 10548 }
            , status: 'OK' } ]
            }
          ]
        }
      ].forEach( function( testCase ){
        var txt = 'Origins: {origins}, Destinations: {destinations}'
          .replace( '{origins}', testCase.origins.join(',') )
          .replace( '{destinations}', testCase.destinations.join(',') );

        it( txt, function( done ){
          var req = DMReq();

          testCase.origins.forEach( req.origin.bind( req ) );
          testCase.destinations.forEach( req.destination.bind( req ) );

          req.send( function( error, rows ){
            assert( !error, error ? error.message : '' );
            assert.deepEqual( testCase.expected, rows );
            done();
          });
        });
      });
    });
  });
});