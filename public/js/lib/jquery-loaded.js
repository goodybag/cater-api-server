define(function(require, exports, module) {
  var $ = require('jquery');
  require('bootstrap');
  require('pickadate');
  require('pickatime');
  require('jquery.inputmask');
  require('jquery.placeholder');
  require('select2');

  $(function(){
    $('input, textarea').placeholder();
  });

  return module.exports = $;
});