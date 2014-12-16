var assert    = require('assert');
var m         = require('../../middleware');
var utils     = require('../../utils');

var req, res;
var next = function() {};

describe('Filters', function() {
  beforeEach(function(){
    req = { query: {} };
    res = { query: { }, locals: { } };
  });

  it('Should load filters into locals', function(done) {
    var mw = m.filters([
      'restaurant-region'
    , 'restaurant-visibility'
    , 'restaurant-sort'
    ]);

    mw(req, res, function() {
      assert(res.locals.filters);
      assert('region' in res.locals.filters);
      assert('show' in res.locals.filters);
      assert('sort' in res.locals.filters);
      done();
    });
  });


  it('Should format links according to query params', function(done) {
    var mw = m.filters(['restaurant-region']);
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
    var mw = m.filters(['restaurant-region', 'restaurant-visibility']);
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
