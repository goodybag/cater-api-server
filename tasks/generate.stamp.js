var fs    = require('fs');
var path  = require('path');

var options = {
  name: 'generate.stamp'
, description: [
    'Generate a stamp worker file\n'
  , '  Usage: grunt generate.stamp:folder'
  ].join('')
, dest: 'public/js/app/stamps'
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
  , "  var utils   = require('../utils');"
  , ""
  , "  module.exports = stampit();"
  , ""
  , "  var stamps = {"
  , "    "
  , "  };"
  , ""
  , "  module.exports = module.exports.compose.apply("
  , "    module.exports"
  , "  , utils.values( stamps )"
  , "  );"
  , ""
  , "  utils.extend( module.exports, stamps );"
  , ""
  , "  return module.exports;"
  , "});"
  ].join('\n');
};

module.exports = function( grunt ){
  grunt.registerTask( options.name, options.description, function(){
    if ( !fs.existsSync( options.dest ) ){
      fs.mkdirSync( options.dest );
    }

    Array.prototype.slice.call( arguments ).forEach( function( folder ){
      var dest = path.join( options.dest, folder );
      grunt.log.writeln( 'Creating', dest );
      fs.mkdirSync( dest );
      fs.writeFileSync(
        path.join( dest, 'index.js')
      , tmpl({ name: folder[0].toUpperCase() + folder.slice(1) })
      );
    });
  });
};