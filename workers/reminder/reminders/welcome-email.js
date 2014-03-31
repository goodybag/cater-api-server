/**
 * Welcome Email
 *
 * Description:
 *   If there are any pending users that have not been welcomed,
 *   and if it's within the send timeframe, welcome them!
 */

var Models  = require('../../../models');
var utils   = require('../../../utils');
var config  = require('../../../config');
var views   = require('../lib/views');
var helpers = require('../../../public/js/lib/hb-helpers');

module.exports.name = 'Welcome Email';

module.exports.schema = {
  lastNotified: true
};

module.exports.check = function( storage, callback ){

};

module.exports.work = function( storage, callback ){
  var stats = {
    errors:               { text: 'Errors', value: 0, objects: [] }
  };
};