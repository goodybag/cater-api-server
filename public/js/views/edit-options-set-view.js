(function( exports ){

  var EditOptionsSetView = exports.EditOptionsSetView = Backbone.View.extend({
    template: Handlebars.partials.edit_options_set

  , optionSetOptionTmpl:  Handlebars.partials.edit_options_set_option

  , events: {
      'click .btn-new-option':    'onAddNewOptionClick'
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

      return this;
    }

  , addNewOption: function(){
      return this.addOption({ name: null, price: null });
    }

  , onAddNewOptionClick: function( e ){
      this.addNewOption();
    }
  });

})( window );