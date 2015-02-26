var assert      = require('assert');
var config      = require('../../../config');
var db          = require('../../../db');
var GeoRes      = require('stamps/responses/geocode');

describe('Stamps', function(){
  describe('Responses', function(){
    describe('Geocode', function(){
      it('.isValidResponse()', function(){
        var res = GeoRes.create({
          res: [ null, requrie('./data/geo-res-1') ]
        , requestAddress: '1600 Amphitheatre Parkway, Mountain View, CA 94043'
        });
      });

      it('.isValidResponse()', function(){
        var res = GeoRes.create({
          res: [ null, requrie('./data/geo-res-2') ]
        });
      });
    });
  });
});