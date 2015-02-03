var assert 		= require('assert');
var config 		= require('../../config');
var db 				= require('../../db');

describe('Find Similar Restaurants', function () {

	var results = null;
	var restaurant_id = 20;
	var options = {
		limit: 10
	};

	before(function (done) {
		db.restaurants.similar(restaurant_id, options, function (error, _results) {
			if (error) throw error;
			results = _results;
			done();
		});
	});

	it ('results should not be empty', function () {
		assert.notEqual(results, null);
		assert.notEqual(results, undefined);
		assert.notEqual(results, []);
	});


});