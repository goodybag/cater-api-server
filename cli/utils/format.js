var yosay = require('yosay');
var chalk = require('chalk');
var Table = require('easy-table');
var wrap = require('word-wrap');
var columnify = require("columnify");

var Lineup = require('lineup');
var lineup = new Lineup();

module.exports = {
  yosayify: function(msg) {
    return yosay(msg);
  },

  // Expecting:
  //   data: { - object to be printed in table
  //     index1: {
  //       key1: "value1",
  //       key2: "value2"
  //     }
  //   }
  //
  //   opts: {
  //     colHeaders - the titles of each column (String array)
  //     keysToShow - only the keys whose values should be printed (String array)
  //   }

  // Will print:
  //   | cols[0] | cols[1] | ... | cols[N] |
  //   | ------- | ------- | ... | ------- |
  //   | index1  | value1  | ... | valueN  |
  //   | index2  | value1  | ... | valueN  |
  //   | ....... | ....... | ... | ....... |
  //   | indexN  | value1  | ... | valueN  |

  tablify: function(data, opts) {
    var t = new Table();
    var colHeaders = opts.colHeaders;
    var keysToShow = opts.keysToShow;
    var iCols = Object.keys(data);

    iCols.forEach(function(iCol, i) {
      colHeaders.forEach(function(header, j) {
        if(j===0) {
          t.cell(chalk.blue(header), chalk.green(iCol));
        } else {
          t.cell(chalk.blue(header), data[iCol][keysToShow[--j]]);
        }
      });
      t.newRow();
    });

    return t.toString();
  },

  wrapify: function(str) {
    return wrap(str);
  },

  // Expecting an non-nested obj, and a 'titles' String array
  // (e.g. ["title1", "title2"])
  columnify: function(obj, colTitles) {
    return columnify(obj, {columns: colTitles});
  },

  notify: function(msg) {
    console.log();
    console.log();
    lineup.sticker.note(msg);
    lineup.sticker.show({
      align: 'center',
      color: 'blue'
    });
    console.log();
  },

  actionify: function(msg, actionType) {
    if(actionType==="info") {
      var infoStr = lineup.icon('info') + lineup.colors.blue(' [INFO]    ');
      lineup.action.info(infoStr, msg);
    }

    if(actionType==="success") {
      var successStr = lineup.icon('success') + lineup.colors.green(' [SUCCESS] ');
      lineup.action.success(successStr, msg);
    }

    if(actionType==="warn") {
      var warnStr = lineup.icon('warn') + lineup.colors.yellow(' [WARNING] ');
      lineup.action.warn(warnStr, msg);
    }

    if(actionType==="error") {
      var errorStr = lineup.icon('error') + lineup.colors.red(' [ERROR]   ');
      lineup.action.error(errorStr, msg);
    }
  },

  consolify: function(str) {
    return "\n" + str + "\n\n\n";
  },

  continue: function() {
    console.log("\nPress [ENTER] to continue.");
  }

};
