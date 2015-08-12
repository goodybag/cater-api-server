var fs = require('fs');
var path = require('path');
var db = require('../');

module.exports.run = function(cb) {
  var file = path.join(__dirname, '/../sql/utility-functions.sql');
  var functions = fs.readFileSync(file, 'utf-8');

  db.query(functions, function(err) {
    if (err) return cb(err);

    console.log('Successfully loaded utility functions');
    cb();
  });
};
