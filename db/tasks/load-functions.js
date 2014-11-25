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

var addImports = function( contents ){
  var regs = {
    // Match entire @import statement
    import: /\-{2,}\s*\@import\s\".*\";/g
    // Match up to the begining of file path
  , path1:  /\-{2,}\s*\@import\s\"/g
    // Match after to the end of file path
  , path2:  /\";/g
  };

  return contents.replace( regs.import, function( statement ){
    var file = statement
      .replace( regs.path1, '' )
      .replace( regs.path2, '' )
      .trim();

    file = path.join( __dirname, '/../sql', file );

    return [
      ''
    , '-- ' + file
    , ''
    , fs.readFileSync( file ).toString()
    ].join('\n');
  });
};

module.exports.run = function(callback) {
  var file = path.join(__dirname, '/../sql/functions.sql');
  var functions = addImports( fs.readFileSync(file).toString() );
  db.query(functions, done(callback));
};

if (require.main === module) {
  cli = true;
  module.exports.run();
}
