var fs = require('fs');
var path = require('path');
var semver = require('semver');
var db = require('../');
;

var cli = false;

var deltasDir = '../deltas';

var done = function (callback) {
  return function(error, results) {
    console.log( (error) ? "Error setting to latest delta version" : "Successfully set to latest delta version");
    if(error) console.log(error);
    if (cli) return process.exit( (error) ? 1 : 0 );
    else if(callback) callback(error, results);
  }
};

module.exports.run = function (callback) {
  var deltas = fs.readdirSync(path.join( __dirname, deltasDir))
    .filter(function (file) {
      return (
        fs.statSync(path.join(__dirname, deltasDir, file)).isFile() &&
        file.slice(-4) === '.sql'
      );
    })
    .sort(function (a, b) {
      // default sort is lexicographically, we need to sort by semver

      // strip off the '.sql'
      a = a.slice(0, -4);
      b = b.slice(0, -4);
      return semver.compare(a,b);
    })
  ;

  if (deltas.length) {
    var latest = deltas[deltas.length -1];
    return db.query("insert into deltas (version, date) values ('"+latest.slice(0, -4)+"', 'now()');", done(callback));
  }
  callback (null);
};

if (require.main === module) {
  cli = true;
  module.exports.run();
}