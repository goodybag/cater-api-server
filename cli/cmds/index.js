var shell = require('minish');

// Shell command functions
var help = require('./help');
var version = require('./version');
var start = require('./start');
var stop = require('./stop');
var restart = require('./restart');

// Add commands to shell
shell.command(["help", "h"], "Table of available commands.", help);
shell.command(["version", "v"], "Current version.", version);
shell.command(["start", "st"], "Starts the server.", start);
shell.command(["stop", "stp"], "Stops the server.", stop);
shell.command(["restart", "rst"], "Restarts the server, if already running.", restart);

module.exports = shell;
