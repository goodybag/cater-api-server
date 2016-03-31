var format = require('../utils').format;
var strUtil = require('../utils').strings;
var name = require('../config').name;
var description = require('../config').description;
var version = require('../config').version;

var chalk = require('chalk');

module.exports = function(context) {
  // Command: version
  // Print out version of app
  var output =
    strUtil.concat([
      "v",
      version
    ]);

  output = format.wrapify(output);

  console.log(format.consolify(output));
  context.end();
};
