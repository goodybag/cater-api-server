var utils = require('../utils');
var config = require('../config.json');

var chalk = require('chalk');
var superb = require('superb');

// Message inside the speech bubble
var greeting_msg = utils.strings.concat([
  chalk.blue("Welcome to the "),
  chalk.red.underline(config.name),
  chalk.red("!\n"),
  chalk.blue("You are " + superb() + "!")
]);

// Message with 'yosay' human
var greeting_yosay = utils.format.yosayify(greeting_msg);

// Further info about cli
var greeting_info = utils.strings.concat([
  config.description,
  " (v",
  config.version,
  ")\n",
  "Type 'help' to see a list of available commands.",
  "\n\n"
]);

// Finalized greeting
var greeting = utils.strings.concat([
  greeting_yosay,
  greeting_info
]);

module.exports = greeting;
