define(function(require){
  var $     = require('jquery-loaded');
  var user  = require('data/user');
  var venter =

  require('giftcard');

  return Object.create({
    init: function(){
      $( function(){
        $('.giftcard').giftcard({ user: user });
        $('.giftcard').on('redeem', function(){
          console.log('REDEEMED', arguments);
        })
      });
    }
  });
});