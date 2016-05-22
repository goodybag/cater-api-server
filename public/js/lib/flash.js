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

  , info: function( msg, duration ){
      duration = duration || flash.defaultDuration;

      var modal = $( tmpl( msg ) ).modernModal().open();

      var closeTimeout = setTimeout( modal.close, duration );

      modal.$this.on( 'close', clearTimeout.bind( null, closeTimeout ) );

      return this;
    }

  , successOrError: function( error ){
      if ( error ) return this.error( error );
      return this.success();
    }

  , successOrError2: function( error ){
      if ( error ) return this.showError( error );
      return this.showSuccess();
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

  , showSuccess: function( error ) {
      var yesTitle   = '<span class ="flash-success">Success</span>';
      var yesMessage = '<span class ="flash-message">'+ this.successfuls[ ~~( Math.random() * this.successfuls.length ) ] +'</span>';

      return flash.info([
        yesTitle
      , yesMessage
      ].join(''), 3000 );
    }

  , showError: function( error ){
      if( error.responseJSON ){
        console.error(error);

        var errTitle   = '<span class="flash-error">'+ error.responseJSON.name +'</span>';
        var errMessage = '<span class="flash-message">'+ error.responseJSON.message +'</span>';
        var errDetails = '<span class="flash-details">'+ error.responseJSON.details.join(', ') +'</span>';

        return flash.info([
          errTitle
        , errMessage
        , errDetails
        ].join(''), 5000 );
      } else {
        this.error( error );
      }
    }
  };

  return Object.create( flash );
});
