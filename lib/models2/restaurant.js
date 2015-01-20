var Base  = require('./base');
var utils = require('../../utils');

module.exports = Restaurant;

function Restaurant( data ){
  Base.call( this, data );
}

Restaurant.prototype = new Base();

Restaurant.create = function( data ){
  return new Restaurant( data );
};

