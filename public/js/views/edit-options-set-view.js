(function( exports ){

  var EditOptionsSetView = exports.EditOptionsSetView = Backbone.View.extend({
    template: Handlebars.partials.edit_options_set

  , optionSetOptionTmpl:  Handlebars.partials.edit_options_set_option

  , optionExpandedTmpl: Handlebars.partials.edit_options_option_expanded

  , events: {
      'click .btn-new-option':                    'onAddNewOptionClick'
    , 'click .btn-delete-option':                 'onDeleteOptionClick'
    , 'click .btn-delete-option-set-option':      'onDeleteOptionSetOptionClick'
    , 'click .btn-expand-option-set-option':      'onExpandOptionSetOptionClick'
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

    /**
     * Expands the option to show more editing options
     *
     * option may be:
     * - String ID of the option to expand
     * - DOM Node of the option to expand
     * - jQuery element of the option to expand
     *
     * @param  {String|Node|jQuery} option Which option to expand
     * @return {Object}             This instance
     */
  , expandOption: function( option ){
      // Figure which DOM node we're dealing with, conver to jQuery if needed
      if ( typeof option === 'string' ){
        option = this.$el.find('.option-expanded[data-id="' + option + '"]');
      } else if ( option instanceof Node ){
        option = $(option);
      } else if ( !(option instanceof jQuery) ){
        throw new Error('EditOptionsSetView.expandOption - invalid option type')
      }

      if ( option.length === 0 ){
        throw new Error('EditOptionsSetView.expandOption - cannot find option in DOM');
      }

      option.removeClass('collapsed');
      option.prev('tr').find('.btn-expand-option-set-option').removeClass('collapsed');

      return this;
    }

    /**
     * Collapses the option to show more editing options
     *
     * option may be:
     * - String ID of the option to expand
     * - DOM Node of the option to expand
     * - jQuery element of the option to expand
     *
     * @param  {String|Node|jQuery} option Which option to expand
     * @return {Object}             This instance
     */
  , collapseOption: function( option ){
      // Figure which DOM node we're dealing with, conver to jQuery if needed
      if ( typeof option === 'string' ){
        option = this.$el.find('.option-expanded[data-id="' + option + '"]');
      } else if ( option instanceof Node ){
        option = $(option);
      } else if ( !(option instanceof jQuery) ){
        throw new Error('EditOptionsSetView.expandOption - invalid option type')
      }

      if ( option.length === 0 ){
        throw new Error('EditOptionsSetView.expandOption - cannot find option in DOM');
      }

      option.addClass('collapsed');
      option.prev('tr').find('.btn-expand-option-set-option').addClass('collapsed');

      return this;
    }

  , toggleOptionExpansion: function( option ){
      // Figure which DOM node we're dealing with, conver to jQuery if needed
      if ( typeof option === 'string' ){
        option = this.$el.find('.option-expanded[data-id="' + option + '"]');
      } else if ( option instanceof Node ){
        option = $(option);
      } else if ( !(option instanceof jQuery) ){
        throw new Error('EditOptionsSetView.expandOption - invalid option type')
      }

      return this[ option.hasClass('collapsed') ? 'expandOption' : 'collapseOption' ]( option );
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

  , onExpandOptionSetOptionClick: function( e ){
      while ( e.target.tagName !== 'TR' ) e.target = e.target.parentElement;

      this.toggleOptionExpansion( $(e.target).find('+ .option-expanded') );
    }
  });

})( window );