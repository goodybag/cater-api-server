/**
 * This middleware extends `res` with csv utility functions
 */

var config = require('../config');
var utils = require('../utils');

var csv = {
    writeFilename: function(filename) {
      this.header( 'Content-Type', 'text/csv' );
      this.header( 'Content-Disposition', 'attachment;filename=' + filename );
    },

    writeRow: function(res, columns) {
      this.write(columns.join(',') + '\n');
    },

    writeRowQuoted: function(res, columns) {
      this.write(utils.map(columns, csv.quoteVal).join(',') + '\n');
    },

    quoteVal: function(val) {
      return val ? '"' + val + '"' : '';
    }
};

module.exports = function(options) {
  return function(req, res, next) {
    if ( res.csv ) throw new Error('res.csv already exists!');

    res.csv = csv.bindAll()
    res.csv.writeHeaders = csv.writeFilename.bind(res);
    next(); 
  }
}