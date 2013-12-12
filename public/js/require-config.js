var require = {
  //By default load any module IDs from js/lib
  baseUrl: '/js/lib'
  //except, if the module ID starts with "app",
  //load it from the js/app directory. paths
  //config is relative to the baseUrl, and
  //never includes a ".js" extension since
  //the paths config could be for a directory.

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
  , {name: 'underscore',        location: '../../components/lodash/dist',               main: 'lodash.compat.js'}
  , {name: 'async',             location: '../../components/async/lib',                 main: 'async.js'}
  , {name: 'amanda',            location: '../../components/amanda/releases/latest',    main: 'amanda.js'}

    // backbone stuff
  , {name: 'backbone',          location: '../../components/backbone',                  main: 'backbone.js'}
  , {name: 'backbone.trackit',  location: '../../components/backbone.trackit',          main: 'backbone.trackit'}

    // ui related stuff
  , {name: 'spin',              location: '../../components/spin.js/dist',              main: 'spin.js'}

    // templating related
  , {name: 'hbs',               location: '../../components/handlebars',                main: 'handlebars.js'}
      // moment stuff
  , {name: 'moment-original',   location: '../../components/moment',                    main: 'moment.js'}
  , {name: 'moment-timezone',   location: '../../components/moment-timezone',           main: 'moment-timezone.js'}

    // jquery stuff
  , {name: 'jquery-original',   location: '../../components/jquery',                    main: 'jquery.js'}
  , {name: 'jquery.inputmask',  location: '../../components/jquery.inputmask/dist',     main: 'jquery.inputmask.bundle.js'}
  , {name: 'jquery-ui',         location: '../../components/jquery-ui/ui',              main: 'jquery-ui.js'}
  , {name: 'picker',            location: '../../components/lalitkapoor-pickadate/lib', main: 'picker.js'}
  , {name: 'pickadate',         location: '../../components/lalitkapoor-pickadate/lib', main: 'picker.date.js'}
  , {name: 'pickadate-legacy',  location: '../../components/lalitkapoor-pickadate/lib', main: 'legacy.js'}
  , {name: 'pickatime',         location: '../../components/lalitkapoor-pickadate/lib', main: 'picker.time.js'}
  , {name: 'bootstrap',         location: '../../components/bootstrap/dist/js',         main: 'bootstrap.js'}
  , {name: 'select2',           location: '../../components/select2',                   main: 'select2.js'}
  ]
, shim: {
    backbone: {
      deps: ['underscore', 'jquery-original']
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
      deps: ['jquery-original']
    , exports: 'jQuery.ui'
    }
  , lodash: {
      exports: '_'
    }
  , bootstrap: {
      deps: ['jquery-original']
    }
  , 'moment-timezone': {
      deps: ['moment-original']
    }
  , picker: {
      deps: ['jquery-original', 'pickadate-legacy']
    }
  , pickadate: {
      deps: ['jquery-original', 'picker']
    }
  , pickatime: {
      deps: ['jquery-original', 'picker']
    }
  , select2: {
      deps: ['jquery-original']
    }
  , 'jquery.inputmask': {
      deps: ['jquery-original']
    }
  , partials: {
      deps: ['hbs']
    }
  }

// , hbs: {
//     disableI18n: true
//   , disableHelpers: true
//   }
};