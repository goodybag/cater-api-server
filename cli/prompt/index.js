var shell = require('../cmds');

var greeting = require('./greeting');
var prompt = require('./prompt');

module.exports = function() {
  shell.write(greeting);
  shell.prompt(prompt);
}
