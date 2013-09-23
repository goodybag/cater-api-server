module.exports = function(grunt) {

  grunt.initConfig({

    files: ['./**/*.js'],

    complexity: {
      generic: {
        src: '<%= files %>',
        options: {
          errorsOnly: false, // show only maintainability errors
          cyclomatic: 3,
          halstead: 8,
          maintainability: 100
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-complexity');

  grunt.registerTask('analyze', ['complexity']);

};
