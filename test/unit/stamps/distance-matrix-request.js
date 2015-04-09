var assert      = require('assert');
var config      = require('../../../config');
var errors      = require('../../../errors');
var db          = require('../../../db');
var DMReq       = require('stamps/requests/distance-matrix');

describe('Stamps', function(){
  describe('Requests', function(){
    describe('Distance Matrix', function(){
      [ { origins: ['Austin, TX']
        , destinations: ['Dallas, TX']
        , expected: [
            { elements: [
                { distance: { text: '195 mi', value: 314264 }
                , duration: { text: '2 hours 56 mins', value: 10558 }
                , status: 'OK'
                }
              ]
            }
          ]
        }
      , { origins: ['Austin, TX', 'Houston, TX']
        , destinations: ['Dallas, TX']
        , expected: [
            {
              "elements" : [
                { "distance" : { "text" : "195 mi", "value" : 314264 }
                , "duration" : { "text" : "2 hours 56 mins", "value" : 10558 }
                , "status" : "OK"
                }
              ]
            },
            {
              "elements" : [
                { "distance" : { "text" : "239 mi", "value" : 384815 }
                , "duration" : { "text" : "3 hours 26 mins", "value" : 12382 }
                , "status" : "OK"
                }
              ]
            }
          ]
        }
      , { origins: ['5336 Krueger Lane, Austin, TX 78723']
        , destinations: ['1900 Ullrich Avenue, Austin, TX 78756', '569 East Linda Lane, Royse City, TX 75189']
        , expected: [
            {
              "elements": [
                { "distance": { "text": "7.4 mi", "value": 11957 }
                , "duration": { "text": "14 mins","value": 824 }
                , "status": "OK"
                },
                { "distance": { "text": "227 mi","value": 365646 }
                , "duration": { "text": "3 hours 24 mins", "value": 12223 }
                , "status": "OK"
                }
              ]
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
            assert.equal( testCase.expected.length, rows.length );
            testCase.expected.forEach( function( row, i ){
              assert.equal( row.elements.length, rows[ i ].elements.length );

              row.elements.forEach( function( element, ii ){
                // Result is within 50 meters of expected
                var d1 = element.distance.value;
                var d2 = rows[ i ].elements[ ii ].distance.value;
                assert( Math.abs( d1 - d2 ) < 50 );

                // Result is within 1min of expected
                var t1 = element.duration.value;
                var t2 = rows[ i ].elements[ ii ].duration.value;
                assert( Math.abs( t1 - t2 ) < 60 );
              });
            });

            done();
          });
        });
      });

      it('Should throw INVALID_REQUEST', function( done ){
        DMReq()
          .origin('Poop')
          .send( function( error ){
            assert.deepEqual( error, errors.google.distanceMatrix.INVALID_REQUEST );
            done();
          });
      });
    });
  });
});