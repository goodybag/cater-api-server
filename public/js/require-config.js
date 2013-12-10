var require = {
  //By default load any module IDs from js/lib
  baseUrl: '/js/lib/'
  //except, if the module ID starts with "app",
  //load it from the js/app directory. paths
  //config is relative to the baseUrl, and
  //never includes a ".js" extension since
  //the paths config could be for a directory.

, paths: {
  //   // handlebars plugin
  //   hbs: '../../components/require-handlebars-plugin/hbs'
  // , Handlebars: '../../components/require-handlebars-plugin/Handlebars'
  // , json2: '../../components/require-handlebars-plugin/hbs/json2'
  // , i18nprecompile: '../../components/require-handlebars-plugin/hbs/i18nprecompile'

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
  , bootstrap: '../../components/bootstrap/dist/js/bootstrap'
  , select2: '../../components/select2/select2'
  , spin: '../../components/spin.js/dist/spin'

    // templating related
  , 'handlebars': '../../components/handlebars/handlebars'

    // moment stuff
  , moment: '../../components/moment/moment'
  , 'moment-timezone': '../../components/moment-timezone/moment-timezone'


  , jquery: '../../components/jquery/jquery'
  , 'jquery-inputmask': '../../components/jquery-inputmask/dist/jquery-inputmask.bundle'
  , 'jquery-ui': '../../components/jquery-ui/ui/jquery-ui'
  , picker: '../../components/lalitkapoor-pickadate/lib/picker'
  , 'pickadate': '../../components/lalitkapoor-pickadate/lib/picker.date'
  , 'pickadate-legacy': '../../components/lalitkapoor-pickadate/lib/legacy'
  , 'pickatime': '../../components/lalitkapoor-pickadate/lib/picker.time'
  }

, shim: {
    backbone: {
      deps: ['underscore', 'jquery']
    , exports: 'Backbone'
    }
  , 'handlebars': {
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
  }

// , hbs: {
//     disableI18n: true
//   , disableHelpers: true
//   }
};