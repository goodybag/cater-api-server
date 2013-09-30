(function( exports ){

  var EditOptionsSetView = exports.EditOptionsSetView = Backbone.View.extend({
    template: Handlebars.partials.edit_options_set

  , optionSetOptionTmpl:  Handlebars.partials.edit_options_set_option

  , events: {
      'click .btn-new-option':                    'onAddNewOptionClick'
    , 'click .btn-delete-option':                 'onDeleteOptionClick'
    , 'click .btn-delete-option-set-option':      'onDeleteOptionSetOptionClick'
    , 'change .option-group-type [type="radio"]': 'onTypeChange'
    , 'change .options-set-option-default':       'onDefaultChange'
    }

  , render: function(){
      this.setElement(
        this.template( this.model )
      );

      return this;
    }

  , addOption: function( option ){
      this.$el.find('.options-set-options').prepend(
        this.optionSetOptionTmpl( option )
      );

      this.delegateEvents();

      return this;
    }

  , addNewOption: function(){
      return this.addOption({ name: null, price: null });
    }

    /**
     * Sets the default state for a given option
     * @param  {Node}   tr The element representing the option
     */
  , setDefault: function( $tr ){
      if ( !($tr instanceof jQuery) ) $tr = $($tr);

      // If it's a radio type, clear others
      if ( this.model.type === 'radio' ){
        $tr.siblings().find('.options-set-option-default').attr( 'checked', null );
      }

      return true;
    }

  , remove: function(){
      this.$el.parent('.col-lg-6').remove();
      Backbone.View.prototype.remove.call( this );
    }

  , onAddNewOptionClick: function( e ){
      this.addNewOption();
    }

  , onDeleteOptionClick: function( e ){
      var this_ = this;
      var $el = $(e.target);

      if ( this.deleteTimeout ){
        clearTimeout( this.deleteTimeout );
        return this.remove();
      }

      var oldText = $el.text();
      $el.text('Are you sure?');

      this.deleteTimeout = setTimeout( function(){
        $el.text( oldText );
        delete this_.deleteTimeout;
      }, 3000);
    }

  , onDeleteOptionSetOptionClick: function( e ){
      while ( e.target.tagName != 'TR' ) e.target = e.target.parentElement;
      $( e.target ).remove();
    }

  , onDefaultChange: function( e ){
      while ( e.target.tagName != 'TR' ) e.target = e.target.parentElement;
      this.setDefault( e.target );
    }

  , onTypeChange: function( e ){
      this.model.type = e.target.value;

      if ( this.model.type === 'radio' ){
        this.setDefault( this.$el.find('.options-set-option').eq(0) );
      }
    }
  });

})( window );