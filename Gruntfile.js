module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.initConfig({
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

  , requirejs: {
      compile: {
        options: {
          out:            'public/dist/app.js'
        , mainConfigFile: './public/js/require-config.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-complexity');

  grunt.registerTask('analyze', ['complexity']);

  grunt.registerTask('build', ['requirejs']);

};
