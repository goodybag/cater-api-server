var utils = require('../utils');
var config = require('../config');

var cmdList = config.commands;
var format = utils.format;
var obj = utils.objects;

module.exports = function(context) {
  var keys = obj.getKeys(cmdList[0]);

  var tabled = format.tablify(cmdList, {
    cols: [ 'Command', 'Alias', 'Description' ],
    keys: keys
  });

  console.log(format.consolify(tabled));
  context.end();
};
