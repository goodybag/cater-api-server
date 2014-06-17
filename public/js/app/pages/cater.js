define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var page = {
    init: function(){
      $(function(){
        $('.navbar').navbar();
      });
    }
  };

  return page;
});