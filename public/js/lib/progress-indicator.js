define(function(require){
  return function( el ){
    var indicator = el.getElementsByClassName('indicator')[0];

    return {
      set: function( percent ){
        indicator.style.width = Math.min( Math.max( 0, percent ), 100 ) + '%';
      }
    };
  };
});