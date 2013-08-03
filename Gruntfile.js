module.exports = function(grunt) {
  grunt.initConfig({
    'compile-handlebars': {
      landingPage: {
        template: 'views/index.hbs',
        templateData: {
          content: grunt.file.read('views/landing.html')
        },
        output: 'public/index.html'
      }
    }
  });

  grunt.loadNpmTasks('grunt-compile-handlebars');

  grunt.registerTask('default', ['compile-handlebars']);
}
