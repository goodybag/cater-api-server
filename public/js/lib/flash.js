define(function(require){
  var $ = require('jquery-loaded');

  var tmpl = function( msg ){
    return [
      '<div class="modal flash-container">'
    , '  <div class="modal-body flash-body">'
    , '    <h2>' + msg + '</h2>'
    , '  </div>'
    , '</div>'
    ].join('\n');
  };

  var flash = {
    defaultDuration: 3000

  , info: function( msg, duration ){
      duration = duration || flash.defaultDuration;

      var modal = $( tmpl( msg ) ).modernModal().open();

      var closeTimeout = setTimeout( modal.close, duration );

      modal.$this.on( 'close', clearTimeout.bind( null, closeTimeout ) );
    }
  };

  return flash;
});