var fs      = require('fs');
var path    = require('path');

var options = {
  name: 'generate.definition'
, description: [
    'Generate a db definition file\n'
  , '  Usage: grunt generate.definition[:name]'
  ].join('')
, dest: 'db/definitions'
, ext: 'js'
};


var tmpl = function( data ){
  return [
    "/**"
  , " * " + data.name.split('-') + " Schema"
  , " */"
  , ""
  , "if (typeof module === 'object' && typeof define !== 'function') {"
  , "  var define = function (factory) {"
  , "    module.exports = factory(require, exports, module);"
  , "  };"
  , "}"
  , ""
  , "var"
  , "  types = require('../data-types')"
  , ";"
  , ""
  , "define(function(require) {"
  , "  var definition = {};"
  , "  definition.name = '" + data.name + "';"
  , ""
  , "  definition.schema = {"
  , "    id: {"
  , "      type: types.serial"
  , "    , nullable: false"
  , "    , unique: true"
  , "    }"
  , "  , created_at: {"
  , "      type: types.timestamptz"
  , "    , nullable: false"
  , "    , default: 'NOW()'"
  , "    }"
  , "  };"
  , ""
  , "  definition.indices = {};"
  , ""
  , "  return definition;"
  , "});"
  ].join('\n');
};


module.exports = function( grunt ){
  grunt.registerTask( options.name, options.description, function(){
    if ( !fs.existsSync( options.dest ) ){
      fs.mkdirSync( options.dest );
    }

    var args = Array.prototype.slice.call( arguments );

    // If they didn't specify a version, just generate a base file
    if ( args.length === 0 ){
      args.push('new-table');
    }

    args.forEach( function( name ){
      var dest = path.join( options.dest, name ) + '.' + options.ext;
      grunt.log.writeln( 'Creating', dest );
      fs.writeFileSync( dest, tmpl({ name: name }) );
    });
  });
};
