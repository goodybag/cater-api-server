var assert    = require('assert');
var config    = require('../../config');
var tray      = require('../../lib/tray-builder');

describe ('OrdrIn Tray Creator', function(){
  var baseOrder = {
    "items": [
      { "hackfood_item_id": 1, "quantity": 3 }
    , { "hackfood_item_id": 2, "options_sets": [{ "options": [{ "hackfood_item_id": 11, "state": true }, { "hackfood_item_id": 22, "state": false }] }] }
    , { "hackfood_item_id": 3, "options_sets": [{ "options": [{ "hackfood_item_id": 11, "state": true }, { "hackfood_item_id": 22, "state": true }] }] }
    ]
  };

  it ('should create an OrdrIn tray', function(){
    assert.equal(
      tray( baseOrder )
    , '1/3+2/1,11+3/1,11,22'
    );
  });
});