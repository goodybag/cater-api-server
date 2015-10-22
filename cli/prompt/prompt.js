var utils = require('../utils');
var config = require('../config.json');

// Finalized prompt
var prompt = utils.strings.concat([
  config.name,
  " > "
]);

module.exports = prompt;
