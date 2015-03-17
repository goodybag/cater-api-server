var assert    = require('assert');
var m         = require('../../middleware');
var utils     = require('../../utils');

var mockRegions = [
  { name: 'Houston, TX', id: 1 }
, { name: 'Austin, TX', id: 2 }
];

var mockDb = {
  regions: {
    find: function(query, callback) {
      callback(null, mockRegions);
    }
  }
};

var req, res;

describe('Filters', function() {
  beforeEach(function(){
    req = { query: {} };
    res = { query: {}, locals: {} };
  });

  it('Should load filters into locals', function(done) {
    var mw = m.filters([
      'regions'
    , 'restaurant-visibility'
    , 'restaurant-sort'
    ], mockDb);

  mw(req, res, function() {
      assert(res.locals.filters);
      assert('region' in res.locals.filters);
      assert('show' in res.locals.filters);
      assert('sort' in res.locals.filters);
      done();
    });
  });


  it('Should format links according to query params', function(done) {
    var mw = m.filters(['regions'], mockDb);
    // todo don't hardcode the region here
    var _req = utils.extend({}, req, { query: { q: 'region:houston, tx' } } );
    mw(_req, res, function() {
      assert(res.locals.filters);
      res.locals.filters.region.forEach(function(region) {
        if ( region.name === 'Houston, TX' ) {
          assert(region.qs.indexOf('region:houston, tx') < 0);
        } else {
          assert(region.qs.indexOf('region:houston, tx') >= 0);
        }
      });
      done();
    });
  });

  it('Should toggle active', function(done) {
    var mw = m.filters(['regions', 'restaurant-visibility'], mockDb);
    var _req = utils.extend({}, req, { query: { q: 'region:austin, tx region:houston, tx' } } );
    mw(_req, res, function() {
      assert(res.locals.filters);
      res.locals.filters.region.forEach(function(region) {
        if ( region.name === 'Austin, TX' || region.name === 'Houston, TX' ) {
          assert(region.active);
        } else {
          assert(!region.active);
        }
      });
      done();
    });
  });
});
