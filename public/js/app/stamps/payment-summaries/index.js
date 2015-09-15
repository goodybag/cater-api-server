/**
 * Payment Summaries
 */

var stampit = require('stampit');
var Promise = require('bluebird');
var utils   = require('utils');

module.exports = stampit();

var stamps = {
  base:         require('./base')
, db:           require('./db')
, email:        require('./email')
};

module.exports = module.exports.compose.apply(
  module.exports
, utils.values( stamps )
);

utils.extend( module.exports, stamps );

Promise.promisifyAll( module.exports.fixed.methods );