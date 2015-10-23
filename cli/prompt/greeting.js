var strUtil = require('../utils').strings;
var format = require('../utils').format;
var name = require('../config.json').name;
var description = require('../config.json').description;
var version = require('../config.json').version;

var chalk = require('chalk');
var superb = require('superb');

var greeting_msg =                      // Message inside the speech bubble
  strUtil.concat([
    chalk.blue("Welcome to the "),
    chalk.red.underline(name),
    chalk.red("!\n"),
    chalk.blue("You are " + superb() + "!")
  ]);

                                              // Message with 'yosay' human
var greeting_yosay = format.yosayify(greeting_msg);

var greeting_info =                               // Further info about cli
  strUtil.concat([
    description,
    " (v",
    version,
    ")\n",
    "Type 'help' to see a list of available commands.",
    "\n\n"
  ]);

var greeting =                                        // Finalized greeting
  strUtil.concat([
    greeting_yosay,
    greeting_info
  ]);

module.exports = greeting;
