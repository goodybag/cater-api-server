var fs    = require('fs');
var path  = require('path');

var options = {
  name: 'generate.stamp'
, description: [
    'Generate a stamp worker file\n'
  , '  Usage: grunt generate.stamp:filename'
  ].join('')
, dest: 'workers/reminder/reminders'
};

var tmpl = function( data ){
  return [
    "/**"
  , " * " + data.name
  , " */"
  , "if ( typeof module === 'object' && module && typeof module.exports === 'object' ){"
  , "  var isNode = true, define = function (factory) {"
  , "    module.exports = factory(require, exports, module);"
  , "  };"
  , "}"
  , ""
  , "define( function( require, exports, module ){"
  , "  var stampit = require('stampit');"
  , "  var utils   = require('utils');"
  , ""
  , "  module.exports = stampit();"
  , ""
  , "var stamps = {"
  , "  "
  , "};"
  , ""
  , "module.exports = module.exports.compose.apply("
  , "  module.exports"
  , ", utils.values( stamps )"
  , ");"
  , ""
  , "utils.extend( module.exports, stamps );"
  , ""
  , "return module.exports;"
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