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

  , successfuls: [
      'You are very handsome.'
    , 'Have a great day!'
    , 'You. Are. The. Best.'
    , 'I like what you\'ve done with your hair'
    , 'Remember the old days?'
    , 'Please click softer next time :('
    , 'You rock!'
    , 'Bet, let, get, pet, Boba Fet'
    , 'You win... This time.'
    , 'I knew you could do it!'
    ]

  , info: function( msg, duration, callback ){
      duration = duration || flash.defaultDuration;

      var modal = $( tmpl( msg ) ).modernModal().open();

      var closeTimeout = setTimeout( function(){
        modal.close();
        if ( callback ) callback();
      }, duration );

      modal.$this.on( 'close', clearTimeout.bind( null, closeTimeout ) );

      return this;
    }

  , successOrError: function( error ){
      if ( error ) return this.error( error );
      return this.success();
    }

  , success: function(){
      return flash.info([
        "Success!<br>"
      , '<small class="really-small">'
      , this.successfuls[ ~~( Math.random() * this.successfuls.length ) ]
      , '</small>'
      ].join(''));
    }

  , error: function( error ){
      console.error( error );

      return flash.info([
        'Error :(<br>'
      , '<small class="really-small">Press CMD+Alt+J</small>'
      ].join(''), 1000 );
    }
  };

  return Object.create( flash );
});
