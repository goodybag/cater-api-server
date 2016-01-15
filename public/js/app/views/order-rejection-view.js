define(function(require, exports, module) {
  var Backbone = require('backbone');
  var $ = require('jquery');
  var AlertView = require('app/views/alert-view');

  var selectors = {
    REJECT_BTN: '[data-role="reject"]'
  , REASON_TEXTBOX: '[name="denied_reason"]'
  };

  var errorFieldMap = {
    reason_denied: 'You must supply a reason'
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

      this.alertView = new AlertView({
        el: this.$el.find('.errors')
      });
    }

  , saveRejection: function(){
      this.model.set( 'reason_denied', this.$el.find( selectors.REASON_TEXTBOX ).val() );

      this.model.send( function( error ){
        this.render();
      }.bind( this ));

      this.render();
    }

  , render: function(){
      var selector = [
        selectors.REJECT_BTN
      , selectors.REASON_TEXTBOX
      ].join(', ');

      // Check for validation errors
      if ( this.model.error && this.model.error.length ){
        this.alertView.show({
          type: 'danger'
        , message:  Array.prototype.slice.call( this.model.error )
                      .map( function( error ){
                        return errorFieldMap[ error.property ];
                      })
                      .filter( function( message ){
                        return !!message;
                      })
                      .join('<br />')
        });
      } else {
        this.alertView.dismiss();
      }

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