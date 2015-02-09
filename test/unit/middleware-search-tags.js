/**
 * Test search tags middleware which parses order params and filters
 * and attaches removable links
 */

var assert = require('assert');
var st = require('../../middleware').searchTags;
var req, res;

describe('Filters', function() {
  beforeEach(function(){
   req = { query: {} };
   res = { query: {}, locals: {} };
  });

  it('Should attach removable search tags', function(done) {
    req.query = {
      cuisines: ['Food Truck', 'BBQ']
    , sort: 'price'
    };
    var mw = st();
    mw(req, res, function next() {
      assert(res.locals.searchTags);
      // ensure each tag has a querystring without itself
      res.locals.searchTags.forEach(function(tag) {
        assert(tag.qs.indexOf(tag) < 0);
      });
      done();
    });
  });
});
