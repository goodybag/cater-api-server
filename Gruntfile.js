var fs            = require('fs');
var path          = require('path');
var pkg           = require('./package.json');
var utils         = require('./utils');
var requireConfig = require('./public/js/require-config');

module.exports = function(grunt) {
  grunt.loadTasks('./tasks');

  grunt.loadNpmTasks('grunt-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-named-modules');

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

  , watch: {
      less: {
        files: [ 'less/*.less', 'less/**/*.less' ]
      , tasks: ['less']
      , options: { spawn: false }
      }

    , handlebars: {
        files: [ 'public/partials/*.hbs' ]
      , tasks: [ 'shell:handlebars' ]
      , options: { spawn: false }
      }
    }

  , shell: {
      handlebars: {
        options: { stdout: true }
      , command: './node_modules/.bin/handlebars public/partials/*.hbs -p -e hbs -f public/dist/partials.js'
      }
    , ensureDir: {
        options: { stdout: true }
      , command: 'mkdir tmp'
      }
    }

  , less: {
      compile: {
        files: {
          "public/dist/landing.css":            "less/core-landing.less"
        , "public/dist/landing-ielt9.css":      "less/ielt9-landing.less"
        , "public/dist/cater-tool.css":         "less/core-cater-tool.less"
        , "public/dist/cater-tool-ielt9.css":   "less/ielt9-cater-tool.less"
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
      app: {
        options: utils.extend( {}, requireConfig, {
          baseUrl: 'public/js/lib'
        , out: 'public/dist/app.js'
        , optimize: 'uglify2'
        , preserveLicenseComments: false
        , useStrict: true
        , findNestedDependencies: false
        , name: 'app/builder'
        , include: ['requireLib']
        , mainConfigFile: 'public/js/require-config.js'

          // For some reason, r.js is not playing nicely with UMD modules
          // We use the same code-snippet everywhere to define UMD modules so
          // the module can be used in node.js as well. However, we don't
          // need that in built production web file, so for each module that
          // has UMD, remove that code.
        , onBuildRead: function( name, path, contents ){
            // Ignore 3rd-party libs
            if ( /components\/\S+\/\S+/.test( path ) ) return contents;

            // Contents not UMDing
            if ( contents.indexOf('module.exports = factory') === -1 ) return contents;

            // Start from the first occurrence of a define call
            return contents.substring( contents.search(/define\s*\(/) );
          }
        })
      }
    , landing: {}
    }
  };

  var landing   = config.requirejs.landing.options = utils.clone( config.requirejs.app.options );
  landing.name  = 'app/pages/landing';
  landing.out   = 'public/dist/landing.js';

  grunt.initConfig( config );

  grunt.loadNpmTasks('grunt-complexity');

  grunt.registerTask( 'analyze',  ['complexity'] );
  grunt.registerTask( 'build',    ['less', 'concat', 'requirejs'] );
  grunt.registerTask( 'default',  ['less', 'watch'] );
};