var shell = require('minish');

// Shell command functions
var help = require('./help');

// Add commands to shell
shell.command(["help", "h"], "Prints out a full list of available commands.", help);

module.exports = shell;
