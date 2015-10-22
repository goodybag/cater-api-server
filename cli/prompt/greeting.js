var utils = require('../utils');
var config = require('../config.json');

var strings = utils.strings;
var format = utils.format;

var chalk = require('chalk');
var superb = require('superb');

// Message inside the speech bubble
var greeting_msg = strings.concat([
  chalk.blue("Welcome to the "),
  chalk.red.underline(config.name),
  chalk.red("!\n"),
  chalk.blue("You are " + superb() + "!")
]);

// Message with 'yosay' human
var greeting_yosay = format.yosayify(greeting_msg);

// Further info about cli
var greeting_info = strings.concat([
  config.description,
  " (v",
  config.version,
  ")\n",
  "Type 'help' to see a list of available commands.",
  "\n\n"
]);

// Finalized greeting
var greeting = strings.concat([
  greeting_yosay,
  greeting_info
]);

module.exports = greeting;
