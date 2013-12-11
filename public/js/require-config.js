var require = {
  //By default load any module IDs from js/lib
  baseUrl: '/js/lib/'
  //except, if the module ID starts with "app",
  //load it from the js/app directory. paths
  //config is relative to the baseUrl, and
  //never includes a ".js" extension since
  //the paths config could be for a directory.

, paths: {
    // text plugin
    text: '../../components/requirejs-text/text'
    // json plugin
  , json: '../../components/requirejs-plugins/src/json'

    // directories
  , components: '../../components'
  , app: '../app'

    // utility
  , lodash: '../../components/lodash/dist/lodash.underscore'
  , underscore: '../../components/lodash/dist/lodash.compat'
  , async: '../../components/async/lib/async.js'
  , amanda: '../../components/amanda/releases/latest/amanda'

    // backbone stuff
  , backbone: '../../components/backbone/backbone'
  , 'backbone.trackit': '../../components/backbone.trackit/backbone.trackit'

    // ui related stuff
  , spin: '../../components/spin.js/dist/spin'

    // templating related
  , 'hbs': '../../components/handlebars/handlebars'

    // moment stuff
  , 'moment-original': '../../components/moment/moment'
  , 'moment-timezone': '../../components/moment-timezone/moment-timezone'

    // jquery stuff
  , 'jquery': '../../components/jquery/jquery'
  , 'jquery.inputmask': '../../components/jquery.inputmask/dist/jquery.inputmask.bundle'
  , 'jquery-ui': '../../components/jquery-ui/ui/jquery-ui'
  , 'picker': '../../components/lalitkapoor-pickadate/lib/picker'
  , 'pickadate': '../../components/lalitkapoor-pickadate/lib/picker.date'
  , 'pickadate-legacy': '../../components/lalitkapoor-pickadate/lib/legacy'
  , 'pickatime': '../../components/lalitkapoor-pickadate/lib/picker.time'
  , 'bootstrap': '../../components/bootstrap/dist/js/bootstrap'
  , 'select2': '../../components/select2/select2'

  , 'partials': 'partials'
  }

, shim: {
    backbone: {
      deps: ['underscore', 'jquery']
    , exports: 'Backbone'
    }
  , 'hbs': {
      exports: 'Handlebars'
    }
  , 'partials': {
      deps: ['handlebars']
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
      deps: ['moment-original']
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
    }
  , 'jquery.inputmask': {
      deps: ['jquery']
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