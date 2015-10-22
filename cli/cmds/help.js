var shell = require('minish');
var utils = require('../utils');
var config = require('../config');

var cmdList = config.commands;
var format = utils.format;
var obj = utils.objects;

module.exports = function(context) {
  var keys = obj.getKeys(cmdList[0]);

  var tableOut = format.table(cmdList, {
    cols: [ 'Command', 'Alias', 'Description' ],
    keys: keys
  });

  shell.write(tableOut);
  context.end();
};
