var cmdObj = require('../config.json').commands;
var arrUtil = require('./arrays');
var objUtil = require('./objects');

module.exports = {
  // returns 'true' if 'item' is a command,
  // 'false' if not
  isCommand: function(item) {
    var commands = this.getCommands();

    if(arrUtil.itemExists(commands, item)) {
      return true;
    }

    return false;
  },

  // returns 'true' if 'item' is an alias,
  // 'false' if not
  isAlias: function(item) {
    var aliases = this.getAliases();

    if(arrUtil.itemExists(aliases, item)) {
      return true;
    }

    return false;
  },

  // returns 'true' if 'item' is a valid command,
  // 'false' if not
  isValidCommand: function(item) {
    var validCommands = this.getAllValidCommands();

    if(arrUtil.itemExists(validCommands, item)) {
      return true;
    }

    return false;
  },

  // get a list of all commands available from config file
  getCommands: function() {
    return Object.keys(cmdObj);
  },

  // get a list of all aliases from config file
  getAliases: function() {
    return arrUtil.fromKeyinNest(cmdObj, "alias");
  },

  // get a list of all valid commands (commands + aliases) from config file
  getAllValidCommands: function() {
    var commands = this.getCommands();
    var aliases = this.getAliases();
    return commands.concat(aliases);
  },

  // get the alias of a given command
  // returns an empty string if not a command
  getAliasOf: function(command) {
    var commands = this.getCommands();

    if(arrUtil.itemExists(commands, command)) {
      return (cmdObj[command]["alias"]);
    }

    return "";
  },

  // returns the command of a given alias
  // returns an empty string if not an alias
  getCommandOf: function(alias) {
    var commands = this.getCommands();
    var aliases = this.getAliases();

    if(arrUtil.itemExists(aliases, alias)) {
      var i = aliases.indexOf(alias);
      return commands[i];
    }

    return "";
  },

  // returns the value of a key from a given command
  // returns an empty string if not a valid command
  getValueOf: function(command, key) {
    var commands = this.getCommands();

    if(arrUtil.itemExists(commands, command)) {
      return (cmdObj[command][key]);
    }

    return "";
  },

  // returns 'true' if the command has flags
  // 'false' if not
  hasFlags: function(command) {
    var flags = this.getValueOf(command, "flags");

    if(!flags || objUtil.isEmpty(flags)) {
      return false;
    }

    return true;
  }
}
