var fs            = require('fs');
var path          = require('path');
var wrench        = require('wrench');
var pkg           = require('./package.json');
var config        = require('./config');
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
  grunt.loadNpmTasks('grunt-s3');

  var gruntConfig = {
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
        , optimize: 'uglify'
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

  , s3: {
      options: {
        key:    config.amazon.awsId
      , secret: config.amazon.awsSecret
      , access:  'public-read'
      , maxOperations: 20
      , headers: {
          // Two Year cache policy (1000 * 60 * 60 * 24 * 730)
          "Cache-Control": "max-age=630720000, public"
        , "Expires": new Date(Date.now() + 63072000000).toUTCString()
        }
      }

    , dev: {
        bucket: config.getEnv('dev').cdn.bucket
      , upload: []
      }

    , staging: {
        bucket: config.getEnv('staging').cdn.bucket
      , upload: []
      }

    , production: {
        bucket: config.getEnv('production').cdn.bucket
      , upload: []
      }
    }
  };

  // Setup s3 to upload all of public
  Object.keys( gruntConfig.s3 ).filter( function( k ){
    return ['options'].indexOf( k ) === -1;
  }).forEach( function( env ){
    [
      { src: './public/dist', dest: 'dist', gzip: true }
    , { src: './public/css', dest: 'css', gzip: true }
    , { src: './public/img', dest: 'img', gzip: false }
    , { src: './public/font', dest: 'font', gzip: false }
    , { src: './public/components/bootstrap', dest: 'components/bootstrap', gzip: true }
    , { src: './public/components/pickadate/lib/themes', dest: 'components/pickadate/lib/themes', gzip: true }
    , { src: './public/components/select2/select2.css', dest: 'components/select2/select2.css', gzip: true }
    , { src: './public/components/respond/src/respond.js', dest: 'components/respond/src/respond.js', gzip: true }
    ].forEach( function( option ){
      if ( fs.statSync( option.src ).isFile() ){
        return gruntConfig.s3[ env ].upload.push( option );
      }

      gruntConfig.s3[ env ].upload = gruntConfig.s3[ env ].upload.concat(
        wrench.readdirSyncRecursive( option.src ).filter( function( f ){
          return fs.statSync( path.join( option.src, f ) ).isFile();
        }).map( function( f ){
          return {
            src:  path.join( option.src, f )
          , dest: path.join( option.dest, f )
          , gzip: option.gzip
          };
        })
      );
    });
  });

  var landing   = gruntConfig.requirejs.landing.options = utils.clone( gruntConfig.requirejs.app.options );
  landing.name  = 'app/pages/landing';
  landing.out   = 'public/dist/landing.js';

  grunt.initConfig( gruntConfig );

  grunt.loadNpmTasks('grunt-complexity');

  grunt.registerTask( 'analyze',  ['complexity'] );
  grunt.registerTask( 'build',    ['less', 'concat', 'requirejs'] );
  grunt.registerTask( 'default',  ['less', 'watch'] );
};