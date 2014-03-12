define(function(require){
  var $ = require('jquery-loaded');

  require('giftcard');

  return Object.create({
    init: function(){
      $( function(){
        $('.giftcard').giftcard();
      });
    }
  });
});