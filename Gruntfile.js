module.exports = function(grunt) {

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

  });

  grunt.loadNpmTasks('grunt-complexity');

  grunt.registerTask('analyze', ['complexity']);

};
