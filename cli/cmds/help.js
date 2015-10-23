var utils = require('../utils');
var config = require('../config.json');
var cmdObj = config.commands;

var format = utils.format;
var strUtil = utils.strings;
var cmdUtil = utils.commands;

var chalk = require('chalk');
var wrap = require('word-wrap');

module.exports = function(context) {
  var args = context.args;

  // Command: help
  // Print full 'help' table if no 'args' have been passed.
  if(!args.length) {
    var helpTable = getHelpTable();
    console.log(format.consolify(helpTable));

  // Command: help <[COMMAND] ...>
  // Print help information specific to the args passed
  } else {
    args.forEach(function(arg) {                            // for each arg

      if(cmdUtil.isValidCommand(arg)) {                   // check if valid
        var usageInfo = getUsageInfo(arg);
        console.log(format.consolify(usageInfo));       // print usage info
      }
    });

  }
  context.end();
};

function getUsageInfo(arg) {
  var command = cmdUtil.getCommandOf(arg) || arg;

  var label =
    strUtil.concat([
      chalk.blue("Command: "),
      chalk.green(cmdUtil.getValueOf(command, "usage"))
    ]);

  var description =
    strUtil.concat([
      cmdUtil.getValueOf(command, "help")
    ]);

  var wrapDescription = format.wrapify(description);

  var output =
    strUtil.concat([
      label,
      "\n\n",
      wrapDescription
    ]);

  var hasFlags = cmdUtil.hasFlags(command);
  if(hasFlags) {
    var flagObj = cmdUtil.getValueOf(command, "flags");
    var flags = chalk.inverse("Flags:");
    var cols = format.columnify(flagObj, [" ", "  "]);
    var wrapCols = format.wrapify(cols);

    output +=
      strUtil.concat([
        "\n\n",
        flags,
        "\n",
        cols
      ]);
  }

  return output;
}

function getHelpTable() {
  var tabled =                                         // get table string
  format.tablify(cmdObj, {
    colHeaders: ['Command', 'Alias', 'Description'],
    keysToShow: ['alias', 'description']
  });

  var footer =                              // get formatted footer string
    strUtil.concat([
      "Type '",
      chalk.green(cmdObj["help"]["usage"]),
      "' to view more info about a particular command, or set of commands."
    ]);

  var wrappedFooter = format.wrapify(footer);                // wrap footer

  var output =                                        // consolidate output
    strUtil.concat([
      tabled,
      "\n",
      wrappedFooter
    ]);

  return output;
}
