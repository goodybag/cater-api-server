define(function(require, exports, module) {
  var Backbone = require('backbone');
  var $ = require('jquery');

  var selectors = {
    REJECT_BTN: '[data-role="reject"]'
  , REASON_TEXTBOX: '[name="denied_reason"]'
  };

  var events = {};

  events[ 'click ' + selectors.REJECT_BTN ] = 'onRejectClick';

  return module.exports = Backbone.View.extend({
    events: {
      'click [data-role="reject"]': 'onRejectClick'
    }

  , initialize: function( options ){
      this.options = options;
      this.isSaving = false;
    }

  , saveRejection: function(){
      this.model.set( 'reason_denied', this.$el.find( selectors.REASON_TEXTBOX ).val() );

      this.model.send( function( error ){
        if ( error ){
          return alert('There was an error processing your request. Please refresh and try agian');
        }

        this.render();
      }.bind( this ));

      this.render();
    }

  , render: function(){
      var selector = [
        selectors.REJECT_BTN
      , selectors.REASON_TEXTBOX
      ].join(', ');

      this.$el.find( selector ).attr(
        'disabled'
      , this.model.isSending() || this.model.hasSent()
      );
    }

  , onRejectClick: function( e ){
      if ( this.isSaving ) return;
      this.saveRejection();
    }
  });
});