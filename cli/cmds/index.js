var shell = require('minish');

// Shell command functions
var help = require('./help');
var version = require('./version');

// Add commands to shell
shell.command(["help", "h"], "List of available commands.", help);
shell.command(["version", "v"], "Current version.", version);

module.exports = shell;
