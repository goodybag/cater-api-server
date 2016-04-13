(function(){
  var requireConfig = {
    //By default load any module IDs from js/lib
    baseUrl: '/js/lib'
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.

  , waitSeconds: 200

    // for moment.js
  , noGlobal: true

  , paths: {
      // plugins
      text: '../../components/requirejs-text/text'
    , json: '../../components/requirejs-plugins/src/json'
    , requireLib: '../../dist/require'

      // directories
    , app:    '../app'
    , views:  '../app/views'
    , spec:   '../../test/unit'
    , stamps: '../app/stamps'
    }

  , packages: [
      // utility
      {name: 'lodash',                  location: '../../components/lodash/dist',               main: 'lodash.underscore.js'}
    , {name: 'async',                   location: '../../components/async/lib',                 main: 'async.js'}
    , {name: 'amanda',                  location: '../../components/amanda/releases/latest',    main: 'amanda.js'}
    , {name: 'leFunc',                  location: '../../components/lefunc/lib',                main: 'leFunc.js'}
    , {name: 'plan',                    location: '../../components/plan.js',                   main: 'index.js'}
    , {name: 'stampit',                 location: '../../components/stampit',                   main: 'stampit.min.js'}
    , {name: 'resource',                location: '../../components/resource.js',               main: 'index.js'}
    , {name: 'chartjs',                 location: '../../components/Chart.js',                  main: 'Chart.js'}

      // backbone stuff
    , {name: 'backbone',                location: '../../components/backbone',                  main: 'backbone.js'}
    , {name: 'backbone.trackit',        location: '../../components/backbone.trackit',          main: 'backbone.trackit'}

      // ui related stuff
    , {name: 'spin',                    location: '../../components/spin.js',                   main: 'spin.js'}
    , {name: 'fullcalendar',            location: '../../components/fullcalendar/dist',         main: 'fullcalendar.js'}
    , {name: 'keymaster',               location: '../../components/keymaster',                 main: 'keymaster.js'}
    , {name: 'react',                   location: '../../components/react',                     main: 'react.js'}

      // templating related
    , {name: 'hbs',                     location: '../../components/handlebars',                main: 'handlebars.js'}
    , {name: 'partials',                location: '../../dist',                                 main: 'partials.js'}
    , {name: 'gb-handlebars-helpers',   location: '../../components/gb-handlebars-helpers',     main: 'index.js'}

      // moment stuff
    , {name: 'moment',                  location: '../../components/moment',                    main: 'moment.js'}
    , {name: 'moment-timezone',         location: '../../components/moment-timezone/builds',    main: 'moment-timezone-with-data-2010-2020.min.js'}

      // jquery stuff
    , {name: 'jquery',                  location: '../../components/jquery',                    main: 'jquery.js'}
    , {name: 'jquery.inputmask',        location: '../../components/jquery.inputmask/dist',     main: 'jquery.inputmask.bundle.js'}
    , {name: 'jquery.placeholder',      location: '../../components/jquery-placeholder',        main: 'jquery.placeholder.js'}
    , {name: 'jquery-ui',               location: '../../components/jquery-ui/ui',              main: 'jquery-ui.js'}
    , {name: 'picker',                  location: '../../components/pickadate/lib',             main: 'picker.js'}
    , {name: 'pickadate-legacy',        location: '../../components/pickadate/lib',             main: 'legacy.js'}
    , {name: 'pickadate',               location: '../../components/pickadate/lib',             main: 'picker.date.js'}
    , {name: 'pickatime',               location: '../../components/pickadate/lib',             main: 'picker.time.js'}
    , {name: 'bootstrap',               location: '../../components/bootstrap/dist/js',         main: 'bootstrap.js'}
    , {name: 'select2',                 location: '../../components/select2',                   main: 'select2.js'}
    , {name: 'jquery.appear',           location: '../../components/jquery-appear/src',         main: 'jquery.appear.js'}

    , {name: 'config',                  location: '../app',                                     main: 'config.js'}
    ]

  , map: {

      // custom replacements
      '*': {
        'handlebars.runtime': 'hbs'
      }

      // deal with jquery
    , 'jquery-loaded': {'jquery': 'jquery'}
    , 'jquery-ui': {'jquery': 'jquery'}
    , 'jquery.inputmask': {'jquery': 'jquery'}
    , 'jquery.placeholder': {'jquery': 'jquery'}
    , 'picker': {'jquery': 'jquery'}
    , 'pickadate-legacy': {'jquery': 'jquery'}
    , 'pickadate': {'jquery': 'jquery'}
    , 'pickatime': {'jquery': 'jquery'}
    , 'bootstrap': {'jquery': 'jquery'}
    , 'select2': {'jquery': 'jquery'}

    // deal with backbone
    , 'backbone.trackit': {'backbone': 'backbone'}
    }

  , shim: {
      backbone: {
        deps: ['lodash', 'jquery']
      , exports: 'Backbone'
      }
    // , 'hbs': {
    //     exports: 'Handlebars'
    //   }
    // , 'lib/partials': {
    //     deps: ['hbs']
    //   }
    , 'backbone.trackit': {
        deps: ['backbone']
      }
    , 'jquery-ui': {
        deps: ['jquery']
      , exports: 'jQuery.ui'
      }
    , lodash: {
        exports: '_'
      }
    , bootstrap: {
        deps: ['jquery']
      }
    , 'moment-timezone': {
        deps: ['moment']
      }
    , picker: {
        deps: ['jquery', 'pickadate-legacy']
      }
    , pickadate: {
        deps: ['jquery', 'picker']
      }
    , pickatime: {
        deps: ['jquery', 'picker']
      }
    , select2: {
        deps: ['jquery']
      , exports: 'Select2'
      }
    , 'jquery.inputmask': {
        deps: ['jquery']
      }
    , 'jquery.placeholder': {
        deps: ['jquery']
      }
    , 'jquery.appear': {
        deps: ['jquery']
      }
    // , partials: {
    //     deps: ['hbs']
    //   }
    , fullcalendar: {
        deps: ['jquery']
      }
    , keymaster: {
        exports: 'key'
      }
    }
  , hbs: {
      disableI18n: true
    , disableHelpers: true
    }
  };

  if ( typeof requirejs !== 'undefined' ){
    requirejs.config( requireConfig );
  } else if ( typeof module !== 'undefined' ) {
    if ( typeof module.exports !== 'undefined' ){
      module.exports = requireConfig;
    }
  } else {
    // No other options available means we're loading config before require
    window.require = requireConfig;
  }
})();
