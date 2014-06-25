var fs = require('fs');
var path = require('path');
var db = require('../');

var cli = false;

var done = function(callback) {
  return function(error, results) {
    console.log( (error) ? "Error loading in functions" : "Successfully loaded in functions");
    if(error) console.log(error);
    if (cli) return process.exit( (error) ? 1 : 0 );
    else if(callback) callback(error, results);
  }
};

module.exports.run = function(callback) {
  var file = path.join(__dirname, '/../sql/functions.sql');
  var functions = fs.readFileSync(file).toString();
  db.query(functions, done(callback));
};

if (require.main === module) {
  cli = true;
  module.exports.run();
}
