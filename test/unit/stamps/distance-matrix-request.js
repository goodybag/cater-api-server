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
            { elements: [
                { distance: { text: '195 mi', value: 314413 }
                , duration: { text: '2 hours 56 mins', value: 10548 }
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
                { "distance" : { "text" : "195 mi", "value" : 314413 }
                , "duration" : { "text" : "2 hours 56 mins", "value" : 10548 }
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
            assert.deepEqual( testCase.expected, rows );
            done();
          });
        });
      });
    });
  });
});