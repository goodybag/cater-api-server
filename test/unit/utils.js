var 
  assert = require('assert')
, config = require('../../config')
, moment = require('moment')
, utils = require('../../utils')
;

describe('utils', function() {
  describe('saneDatetime()', function() {
    it('should return UTC time during regular hours', function() {
      var date = moment().utc().hour(19); // 2 pm CDT
      var result = utils.getSaneDatetime(date);
      assert.equal(result.toString(), date.toString());
    });
    it('should convert datetime during graveyard shift', function() {
      var date = moment().utc().hour(8); // 3am CDT
      var result = utils.getSaneDatetime(date);
      assert.equal(result.hour(), config.graveyard.end);
    });
  });
});