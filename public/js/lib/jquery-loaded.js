define(function(require, exports, module) {
  var $ = require('jquery');

  require('bootstrap');
  require('pickadate');
  require('pickatime');
  require('jquery.inputmask');
  require('jquery.placeholder');
  require('select2');
  require('navbar');
  require('jquery.toggler');
  require('jquery.prefixer');
  require('jquery.modern-modal');
  require('el-toggler').auto();
  require('jquery.popover');
  require('jquery.collapsible');
  require('jquery.appear');
  require('jquery.filter-list');

  $(function(){
    $('input, textarea').placeholder();
  });

  return module.exports = $;
});
