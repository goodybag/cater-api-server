var require = {
  //By default load any module IDs from js/lib
  baseUrl: '/js/lib'
  //except, if the module ID starts with "app",
  //load it from the js/app directory. paths
  //config is relative to the baseUrl, and
  //never includes a ".js" extension since
  //the paths config could be for a directory.

  // for moment.js
, noGlobal: true

, paths: {
    // plugins
    text: '../../components/requirejs-text/text'
  , json: '../../components/requirejs-plugins/src/json'

    // directories
  , app: '../app'
  }
, packages: [
    // utility
    {name: 'lodash',            location: '../../components/lodash/dist',               main: 'lodash.underscore.js'}
  , {name: 'async',             location: '../../components/async/lib',                 main: 'async.js'}
  , {name: 'amanda',            location: '../../components/amanda/releases/latest',    main: 'amanda.js'}

    // backbone stuff
  , {name: 'backbone',          location: '../../components/backbone',                  main: 'backbone.js'}
  , {name: 'backbone.trackit',  location: '../../components/backbone.trackit',          main: 'backbone.trackit'}

    // ui related stuff
  , {name: 'spin',              location: '../../components/spin.js',                   main: 'spin.js'}
  , {name: 'fullcalendar',      location: '../../components/fullcalendar',              main: 'fullcalendar.js'}

    // templating related
  , {name: 'hbs',               location: '../../components/handlebars',                main: 'handlebars.js'}
  , {name: 'partials',          location: '../../dist',                                 main: 'partials.js'}

    // moment stuff
  , {name: 'moment',            location: '../../components/moment',                    main: 'moment.js'}
  , {name: 'moment-timezone',   location: '../../components/moment-timezone',           main: 'moment-timezone.js'}

    // jquery stuff
  , {name: 'jquery',            location: '../../components/jquery',                    main: 'jquery.js'}
  , {name: 'jquery.inputmask',  location: '../../components/jquery.inputmask/dist',     main: 'jquery.inputmask.bundle.js'}
  , {name: 'jquery.placeholder',location: '../../components/jquery-placeholder',        main: 'jquery.placeholder.js'}
  , {name: 'jquery-ui',         location: '../../components/jquery-ui/ui',              main: 'jquery-ui.js'}
  , {name: 'picker',            location: '../../components/lalitkapoor-pickadate/lib', main: 'picker.js'}
  , {name: 'pickadate-legacy',  location: '../../components/lalitkapoor-pickadate/lib', main: 'legacy.js'}
  , {name: 'pickadate',         location: '../../components/lalitkapoor-pickadate/lib', main: 'picker.date.js'}
  , {name: 'pickatime',         location: '../../components/lalitkapoor-pickadate/lib', main: 'picker.time.js'}
  , {name: 'bootstrap',         location: '../../components/bootstrap/dist/js',         main: 'bootstrap.js'}
  , {name: 'select2',           location: '../../components/select2',                   main: 'select2.js'}
  ]

, map: {

    // custom replacements
    '*': {
      'jquery': 'jquery-loaded'
    , 'moment': 'moment-loaded'
    , 'backbone': 'backbone-loaded'
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

    // deal with moment
  , 'moment-loaded': {'moment': 'moment'}
  , 'moment-timezone': {'moment': 'moment'}

  // deal with backbone
  , 'backbone-loaded': {'backbone': 'backbone'}
  , 'backbone.trackit': {'backbone': 'backbone'}

  }

, shim: {
    backbone: {
      deps: ['lodash', 'jquery']
    , exports: 'Backbone'
    }
  , 'hbs': {
      exports: 'Handlebars'
    }
  , 'lib/partials': {
      deps: ['hbs']
    }
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
  , partials: {
      deps: ['hbs']
    }
  , fullcalendar: {
      deps: ['jquery']
    }
  }
// , hbs: {
//     disableI18n: true
//   , disableHelpers: true
//   }
};
