define(function(require){
  var $       = require('jquery-loaded');
  var order   = require('data/order');

  var page = {
    init: function(){
      $(function(){
        $('.navbar').navbar({ toggleText: false, toggleLogin: false });
      });
    }
  };

  return page;
});