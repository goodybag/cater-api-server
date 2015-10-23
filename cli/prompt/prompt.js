var utils = require('../utils');
var config = require('../config.json');

var strUtil = require('../utils').strings;
var name = require('../config.json').name;

// Finalized prompt
var prompt =
  strUtil.concat([
    name,
    ":> "
  ]);

module.exports = prompt;
