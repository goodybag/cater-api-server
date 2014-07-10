var assert    = require('assert');
var utils = require('../../utils');

describe ('utils', function(){
  it ('partition array', function(){
    var isOdd = function(v) { return v%2 === 1 };
    var output = utils.partition([0, 1, 4, 5, 7, 8], isOdd);
    var expected = [ [1, 5, 7], [0, 4, 8] ];
    assert(output.toString() == expected.toString());
  });

  it ('partition object', function(){
    var list = [1, 2, 3, 4, 4, 5, 2];
    var histogram = utils.countBy(list);
    var hasDuplicate = function(val, key, obj) { return val > 1; };
    var output = utils.partition(histogram, hasDuplicate);
    var expected = [ { 2: 2, 4: 2 } , { 1: 1, 3: 1, 5:1 } ];
    assert(JSON.stringify(output) === JSON.stringify(expected));
  });

  it ('partition throws error for invalid type', function() {
    assert.throws(utils.partition.bind(this, 'nobueno'));
    assert.throws(utils.partition.bind(this, 1234));
    assert.throws(utils.partition.bind(this, true));
  });
});