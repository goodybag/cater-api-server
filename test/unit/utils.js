var 
  assert = require('assert')
, config = require('../../config')
, moment = require('moment')
, utils = require('../../utils')
;

var tz = {
  central: 'America/Chicago'
, eastern: 'America/New_York'
};

describe('utils', function() {
  describe('saneDatetime()', function() {
    it('should return datetime during regular hours', function() {
      var date = moment().hour(17); // 5pm central
      var result = utils.getSaneDatetime(date, tz.central);
      assert.equal(result.toString(), date.toString());
    });

    it('should convert datetime during graveyard shift', function() {
      var date = moment().hour(3); // 3am central
      var result = utils.getSaneDatetime(date, tz.central);
      assert.equal(result.hour(), config.graveyard.end);
    });

    it('should return datetime during regular hours east coast', function() {
      var date = moment().hour(17); // 5pm eastern
      var result = utils.getSaneDatetime(date, tz.eastern);
      date = moment.tz(date, tz.eastern);
      assert.equal(result.toString(), date.toString());
    });

    it('should convert datetime during graveyard shift east coast', function() {
      var date = moment().hour(3); // 3am eastern
      var result = utils.getSaneDatetime(date, tz.eastern);
      date = moment.tz(date, tz.eastern);
      assert.equal(result.hour(), config.graveyard.end);
    });

    it('should return datetime during regular hours based on implicit tz', function() {
      var date = moment().tz(tz.eastern).hour(17); // 5pm eastern
      var result = utils.getSaneDatetime(date);
      assert.equal(result.toString(), date.toString());
    });
    
    it('should convert datetime during graveyard shift based on implicit tz', function() {
      var date = moment().tz(tz.eastern).hour(3); // 3am eastern
      var result = utils.getSaneDatetime(date);
      assert.equal(result.hour(), config.graveyard.end);
    });
  });
});