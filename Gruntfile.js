var fs            = require('fs');
var path          = require('path');
var utils         = require('./utils');
var requireConfig = require('./public/js/require-config');

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  var config = {
    complexity: {
      generic: {
        src: ['./**/*.js'],
        options: {
          errorsOnly: false, // show only maintainability errors
          cyclomatic: 10,
          halstead: 8,
          maintainability: 100
        }
      }
    }

  , concat: {
      // Concat the require config to require.js lib
      // so that the config is loaded before modules are
      compile: {
        src: [
          'public/components/requirejs/require.js'
        , 'public/js/require-config.js'
        ]
      , dest: 'public/dist/require.js'
      }
    }

  , requirejs: {
      compile: {
        options: utils.extend( {}, requireConfig, {
          baseUrl: 'public/js/lib'
        , out: 'public/dist/app.js'
        , optimize: 'uglify2'
        , preserveLicenseComments: false
        , useStrict: true
        , findNestedDependencies: false
        , name: 'app/builder'
        , include: ['requireLib']
        , wrap: true
        , mainConfigFile: 'public/js/require-config.js'
        , onBuildRead: function( name, path, contents ){
            var first6Lines = contents.split('\n').slice( 0, 6 ).join('\n');
            if ( first6Lines.indexOf('module.exports = factory') === -1 ) return contents;

            return contents.replace( first6Lines, '' );
          }
        })
      }
    }
  };

  grunt.initConfig( config );

  grunt.loadNpmTasks('grunt-complexity');

  grunt.registerTask('analyze', ['complexity']);

  grunt.registerTask('build', [ 'concat', 'requirejs' ]);
};