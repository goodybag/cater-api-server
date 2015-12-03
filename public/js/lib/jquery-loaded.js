define(function(require, exports, module) {
  var $ = require('jquery');

  require('bootstrap');
  require('pickadate');
  require('pickatime');
  require('jquery.inputmask');
  require('jquery.placeholder');
  require('select2');
  require('navbar');
  require('field-matcher');
  require('jquery.preview');
  require('jquery.row-expand');
  require('jquery.toggler');
  require('jquery.prefixer');
  require('jquery.modern-modal');
  require('el-toggler').auto();
  require('jquery.popover');
  require('jquery.collapsible');
  require('jquery.appear');
  require('jquery.filter-list');
  var autoSelect = require('./auto-select');

  $(function(){
    $('input, textarea').placeholder();
    autoSelect.init( $ );
  });

  return module.exports = $;
});
