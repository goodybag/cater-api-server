var format = require('../utils').format;
var version = require('../config').version;

module.exports = function(context) {
  // Command: version
  // Print out version of app
  console.log(format.consolify("v" + version));
  context.end();
};
