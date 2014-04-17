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
  require('preview');

  $(function(){
    $('input, textarea').placeholder();
  });

  return module.exports = $;
});