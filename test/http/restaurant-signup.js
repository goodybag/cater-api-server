process.env['GB_ENV'] = 'dev';

var assert  = require('assert');
var request = require('request');
var app     = require('../../app');
var db      = require('../../db');
var utils   = require('../../utils');
var config  = require('../../config');

describe('Restaurant Signup', function () {

  var data = {
    data: {
      user_name: 'foo',
      user_number: '0123456789',
      name: 'foobar',
      website: 'foobar.com',
      service: 'delivery'
    }
  };

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

/**
* Signup Flow
*/

describe('Signup Flow', function () {

  var data = {
    data: {
      user_name: 'foo',
      user_number: '0123456789',
      name: 'foobar',
      website: 'foobar.com',
      service: 'delivery'
    }
  };

  after(function (done) {
    if (data.id) {
      console.log('deleting id: ' + data.id);
      db.restaurant_signups.remove({ id: data.id }, done);
    }
  });

  it.only('increment step', function (done) {


    var jar = request.jar();

    var options = {
      jar: jar
    };

    var URI = config.baseUrl + '/api/restaurants/join';

    utils.post(URI, data, options, function (error, res, body) {
      assert(!error, error);

      data.id = body.id;

      utils.put(
        URI
      , data
      , options
      , function (error, res, body) {
          assert(!error, error);
          assert.equal(res.statusCode, 200);

          assert.equal(res.request.uri.pathname, '/api/restaurants/join');

          done();
      });

    });


  });

});

