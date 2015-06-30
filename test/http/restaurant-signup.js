process.env['GB_ENV'] = 'dev';

var assert  = require('assert');
var request = require('request');
var app     = require('../../app');
var db      = require('../../db');
var utils   = require('../../utils');
var config  = require('../../config');
var fixtures = require('../fixtures/restaurant-signup');

describe('Restaurant Signup', function () {

  var data = utils.clone(fixtures.restaurant);

  after(function (done) {
    if (data.id) {
      console.log('deleting id: ' + data.id);
      db.restaurant_signups.remove({ id: data.id }, done);
    }
  });

  it('GET /restaurants/join', function (done) {
    utils.test.get('/restaurants/join', function (error, res, body) {
      assert(!error, error);
      assert.equal(res.statusCode, 200);
      assert.equal(res.request.uri.pathname, '/restaurants/join');
      done();
    });
  });

  it('POST /api/restaurants/join', function (done) {

    utils.test.post('/api/restaurants/join', data, function (error, res, body) {
      assert(!error, error);
      assert.equal(res.statusCode, 200);
      assert.equal(res.request.uri.pathname, '/api/restaurants/join');

      body = JSON.parse(body);
      assert.equal(body.step, 1);
      assert.equal(body.status, 'pending');

      data.id = body.id;

      done();
    });
  });

});


describe('Update Restaurant Signup', function () {

  var data = utils.clone(fixtures.restaurant);
  var ENDPOINT = config.baseUrl + '/api/restaurants/join';

  var jar = request.jar();
  var options = { jar: jar };

  after(function (done) {
    if (data.id) {
      console.log('deleting id: ' + data.id);
      db.restaurant_signups.remove({ id: data.id }, done);
    }
  });

  before(function (done) {
    utils.post(ENDPOINT, data, options, function (error, res, body) {
      if (error || res.statusCode !== 200) return done(error);
      data.id = body.id;

      done();
    });
  });

  it('PUT /api/restaurants/join', function (done) {
    utils.put(ENDPOINT, data, options, function (error, res, body) {
      assert(!error, error);
      assert.equal(res.statusCode, 200);
      assert.equal(res.request.uri.pathname, '/api/restaurants/join');

      done();
    });

  });

});

