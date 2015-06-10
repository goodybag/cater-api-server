var assert      = require('assert');
var config      = require('../../../config');
var db          = require('../../../db');
var GeoRes      = require('stamps/responses/geocode');
var GeoResult   = require('stamps/responses/geocode-result');

describe('Stamps', function(){
  describe('Responses', function(){
    describe('Geocode', function(){
      it('.isValidResponse()', function(){
        var res = GeoRes.create({
          res: [ null, require('./data/geo-res-1') ]
        , requestAddress: '1600 Amphitheatre Parkway, Mountain View, CA 94043'
        });

        assert( res.isValidAddress() );
      });

      it('.isValidResponse()', function(){
        var res = GeoRes.create({
          res: [ null, require('./data/geo-res-2') ]
        , requestAddress: 'Mountain View Road, California, USA'
        });

        assert( !res.isValidAddress() );
      });

      it('.toAddress()', function(){
        var res = GeoRes.create({
          res: [ null, require('./data/geo-res-1') ]
        , requestAddress: '1600 Amphitheatre Parkway, Mountain View, CA 94043'
        });

        assert.deepEqual( res.toAddress(), {
          street: '1600 Amphitheatre Parkway'
        , street2: null
        , city: 'Mountain View'
        , state: 'CA'
        , zip: '94043'
        });
      });

      it('.toAddress()', function(){
        var res = GeoRes.create({
          res: [ null, {
            results: [{
              types: ['subpremise']
            , address_components: [
                { long_name: 'l131',
                  short_name: 'l131',
                  types: [ 'subpremise' ] },
                { long_name: '5555',
                  short_name: '5555',
                  types: [ 'street_number' ] },
                { long_name: 'North Lamar Boulevard',
                  short_name: 'N Lamar Blvd',
                  types: [ 'route' ] },
                { long_name: 'North Loop',
                  short_name: 'North Loop',
                  types: [ 'neighborhood', 'political' ] },
                { long_name: 'Austin',
                  short_name: 'Austin',
                  types: [ 'locality', 'political' ] },
                { long_name: 'Travis County',
                  short_name: 'Travis County',
                  types: [ 'administrative_area_level_2', 'political' ] },
                { long_name: 'Texas',
                  short_name: 'TX',
                  types: [ 'administrative_area_level_1', 'political' ] },
                { long_name: 'United States',
                  short_name: 'US',
                  types: [ 'country', 'political' ] },
                { long_name: '78751',
                  short_name: '78751',
                  types: [ 'postal_code' ] }
              ]
            }]
          }]
        , requestAddress: '5555 N. Lamar Blvd Suite L131'
        });

        assert.deepEqual( res.toAddress(), {
          street: '5555 North Lamar Boulevard'
        , street2: 'l131'
        , city: 'Austin'
        , state: 'TX'
        , zip: '78751'
        });
      });

      it('.toAddress() should throw', function(){
        var res = GeoRes.create({
          res: [ null, require('./data/geo-res-2') ]
        , requestAddress: 'Mountain View Road, California, USA'
        });

        assert.throws( function(){
          res.toAddress();
        }, Error );
      });

      describe('GeocodeResult', function(){
        it('.toLatLon()', function(){
          var result = GeoResult.create( require('./data/geo-res-1').results[0] );

          assert.deepEqual( result.toLatLon(), {
            x: 37.4224879
          , y: -122.08422
          });
        });
      });
    });
  });
});