requirejs.config({
  //By default load any module IDs from js/lib
  baseUrl: 'public/js/lib'
  //except, if the module ID starts with "app",
  //load it from the js/app directory. paths
  //config is relative to the baseUrl, and
  //never includes a ".js" extension since
  //the paths config could be for a directory.
, paths: {
    components: '../../components'
  , app: '../app'

  , amanda: '../../components/amanda/releases/latest/amanda.js'
  , async: '../../components/async/lib/async.js'
  , 'backbone.trackit': '../../components/backbone.trackit/backbone.trackit.js'
  , backbone: '../../components/backbone/backbone.js'
  , bootstrap: '../../components/bootstrap/dist/js/bootstrap.js'
  , 'jquery-ui': '../../components/jquery-ui/ui/jquery-ui.js'
  , 'jquery-inputmask': '../../components/jquery-inputmask/dist/jquery-inputmask.bundle.js'
  , handlebars: '../../components/handlebars/handlebars.js'
  , moment: '../../components/moment/moment.js'
  , 'moment-timezone': '../../components/moment-timezone/moment-timezone.js'
  , select2: '../../components/select2/select2.js'
  , spin: '../../components/spin.js/dist/spin.js'
  , jquery: '../../components/jquery/jquery.js'
  , underscore: '../../components/underscore/underscore.js'
  }

, shim: {
    backbone: {
      deps: ['underscore', 'jquery']
    , exports: 'Backbone'
    }
  , 'backbone.trackit': {
      deps: ['backbone']
    }
  , 'jquery-ui': {
      deps: ['jquery']
    }
  , underscore: {
      exports: '_'
    }
  , bootstrap: {
      deps: ['jquery']
    }
  }
});