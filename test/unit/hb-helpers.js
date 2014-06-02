var assert    = require('assert');
var helpers = require('../../public/js/lib/hb-helpers');

describe ('Handlebars Helpers', function(){
  it ('should convert pennies to dollars', function(){
    assert.equal(helpers.dollars(2623.5), '26.24');
    assert.equal(helpers.dollars(100.5), '1.01');
    assert.equal(helpers.dollars(55117.5), '551.18');
  });
});