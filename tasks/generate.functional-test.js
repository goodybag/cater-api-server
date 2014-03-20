var fs    = require('fs');
var path  = require('path');

var options = {
  name: 'generate.functional-test'
, description: [
    'Generate a functional test scaffold file\n'
  , '  Usage: grunt generate.functional-test:filename'
  ].join('')
, dest: 'test/functional'
};

var tmpl = function( data ){
  return [
    "/**"
  , " * Functional Test: " + data.name
  , " * "
  , " * This is the description of this test"
  , " */"
  , ""
  , "var config = require('../../functional-config');"
  , ""
  , "// See that `1` there? Change that to the number of assertions you expect to perform"
  , "casper.test.begin( 'Test description', 1, function( test ){"
  , "  casper.start( config.baseUrl );"
  , ""
  , "  casper.then( function(){"
  , "    // Assert something"
  , "  });"
  , ""
  , "  casper.run( test.done.bind( test ) );"
  , "});"
  ].join('\n');
};

module.exports = function( grunt ){
  grunt.registerTask( options.name, options.description, function(){
    if ( !fs.existsSync( options.dest ) ){
      fs.mkdirSync( options.dest );
    }

    Array.prototype.slice.call( arguments ).forEach( function( filename ){
      var dest = path.join( options.dest, filename ) + '.js';
      grunt.log.writeln( 'Creating', dest );
      fs.writeFileSync( dest, tmpl({ name: filename[0].toUpperCase() + filename.slice(1) }) );
    });
  });
};