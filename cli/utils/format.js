var yosay = require('yosay');
var chalk = require('chalk');
var Table = require('easy-table');

module.exports = {
  yosayify: function(msg) {
    return yosay(msg);
  },

  // Expecting:
  //   data - array of objects to be printed in table
  //   opts: {
  //     cols - an array of column headers (String)
  //     keys - an array of keys on each data object (String)
  //   }
  tablify: function(data, opts) {
    var t = new Table();
    var cols = opts.cols;
    var keys = opts.keys;
    var tableOut = "";

    if(data && cols && keys) {
      data.forEach(function(dd) {
        cols.forEach(function(col, i) {
          var key = keys[i];
          t.cell(chalk.blue(col), dd[key]);
        });
        t.newRow();
      });
      tableOut = "\n" + t.toString();
    };

    return tableOut;
  },

  consolify: function(str) {
    return "\n" + str + "\n\n\n";
  }

};
