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
      js: {
        files:{
          'public/dist/js/base.min.js': [
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

          , 'public/components/moment/min/moment.min.js'

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
  , cssmin: {
      combine: {
        files: {
          'public/dist/css/combined.css': [
            'public/components/bootstrap/dist/css/bootstrap.min.css'
          , 'public/components/select2/select2.css'
          , 'public/components/lalitkapoor-pickadate/lib/themes/classic.css'
          , 'public/components/lalitkapoor-pickadate/lib/themes/classic.date.css'
          , 'public/components/lalitkapoor-pickadate/lib/themes/classic.time.css'
          , 'public/css/gb-icon.css'
          , 'public/css/aleo.css'
          , 'public/css/proxima-nova.css'
          , 'public/css/kit.css'
          , 'public/css/main.css'
          , 'public/css/components.css'
          , 'public/css/theme.css'
          ]
        }
      }
    , minify: {
        src: ['public/dist/css/combined.css']
      , dest: 'public/dist/css/base.min.css'
      }
    }
  , copy: {
      main: {
        files: [
          {expand: true, cwd: 'public/font', src: ['**'], dest: 'public/dist/font'}
        , {expand: true, cwd: 'public/img', src: ['**'], dest: 'public/dist/img'}
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-complexity');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('analyze', ['complexity']);
  grunt.registerTask('default', ['uglify', 'cssmin', 'copy']);

};
