var dirac = require('dirac');
var graph = require('../structure');
var async = require('async');
var utils = require('../utils');

var tables = graph.sort().reverse();

exports.run = createTables;

function createTables(cb) {
  async.eachSeries(tables, function(table, cb) {
    var fileName = __dirname + '/../definitions/' + table.replace(/_/g, '-');
    utils.createTable(require(fileName), cb);
  }, function(err) {
    if (err) return cb(err);

    console.log('Successfully created tables');
    if (cb) cb(null);
  });
}
