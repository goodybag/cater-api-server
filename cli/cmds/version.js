var utils = require('../utils');
var config = require('../config');

var format = utils.format;

module.exports = function(context) {
  console.log(format.consolify("v" + config.version));
  context.end();
};
