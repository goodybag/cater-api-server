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

    writeRow: function(columns) {
      this.write(utils.map(columns, csv.quoteVal).join(',') + '\n');
    },

    quoteVal: function(val) {
      return val ? '"' + val + '"' : '';
    }
};

module.exports =  function(req, res, next) {
  if ( res.csv ) throw new Error('res.csv already exists!');
  res.csv = {};
  for ( var method in csv ) res.csv[method] = csv[method].bind(res);
  next(); 
}
