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
  , uglify: {
      options: {
        mangle: false
      , compress: false
      , beautify: true
      }
    , js: {
        files:{
          'public/dist/js/min.js': [
            'public/components/jquery/jquery.min.js'
          , 'public/components/jquery-ui/ui/jquery-ui.js'
          , 'public/components/amanda/releases/latest/amanda.min.js'
          , 'public/components/select2/select2.min.js'
          , 'public/components/async/lib/async.js'
          , 'public/components/underscore/underscore-min.js'
          , 'public/components/backbone/backbone-min.js'
          , 'public/components/bootstrap/dist/js/bootstrap.min.js'

          , 'public/components/lalitkapoor-pickadate/lib/picker.js'
          , 'public/components/lalitkapoor-pickadate/lib/picker.date.js'
          , 'public/components/lalitkapoor-pickadate/lib/picker.time.js'
          , 'public/components/lalitkapoor-pickadate/lib/legacy.js'

          , 'public/components/moment-timezone/min/moment-timezone.min.js'

          , 'public/components/handlebars/handlebars.js'

          , 'public/js/hb-helpers.js'

          , 'public/js/utils.js'
          ]
        , 'public/dist/js/mvc.min.js': [
            'public/js/collections/*.js'
          , 'public/js/models/*.js'
          , 'public/js/views/form-view.js'
          , 'public/js/views/*.js'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-complexity');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('analyze', ['complexity']);

};
