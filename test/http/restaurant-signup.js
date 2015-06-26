process.env['GB_ENV'] = 'dev';

var assert  = require('assert');
var app     = require('../../app');
var db      = require('../../db');
var utils   = require('../../utils');
var config  = require('../../config');

describe('Restaurant Signup', function () {

  it('GET /restaurants/join', function (done) {
    utils.test.get('/restaurants/join', function (error, res, body) {
      assert(!error, error);
      assert.equal(res.statusCode, 200);
      assert.equal(res.request.uri.pathname, '/restaurants/join');
      done();
    });
  });

  it('POST /api/restaurants/join', function (done) {

    var data = {
      data: {
        user_name: 'foo',
        user_number: '0123456789',
        name: 'foobar',
        website: 'foobar.com',
        service: 'delivery'
      }
    };

    utils.test.post('/api/restaurants/join', data, function (error, res, body) {
      assert(!error, error);
      assert.equal(res.statusCode, 200);
      assert.equal(res.request.uri.pathname, '/api/restaurants/join');
      done();
    });
  });

});