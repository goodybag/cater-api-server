(function( exports ){

  var EditOptionsSetView = exports.EditOptionsSetView = Backbone.View.extend({
    template: Handlebars.partials.edit_options_set

  , optionSetOptionTmpl:  Handlebars.partials.edit_options_set_option

  , events: {
      'click .btn-new-option':                'onAddNewOptionClick'
    , 'click .btn-delete-option':             'onDeleteOptionClick'
    , 'click .btn-delete-option-set-option':  'onDeleteOptionSetOptionClick'
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

  , onAddNewOptionClick: function( e ){
      this.addNewOption();
    }

  , onDeleteOptionClick: function( e ){
      this.$el.parent('.col-lg-4').remove();
      this.remove();
    }

  , onDeleteOptionSetOptionClick: function( e ){
      while ( e.target.tagName != 'TR' ) e.target = e.target.parentElement;
      $( e.target ).remove();
    }
  });

})( window );