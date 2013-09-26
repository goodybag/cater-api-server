(function( exports ){

  var EditOptionsGroupView = Backbone.View.extend({
    template: Handlebars.partials.edit_options_group

  , events: {

    }

  , initialize: function( options ){
      return this;
    }

  , render: function(){
      this.setElement(
        this.template({
          model: this.model.toJSON()
        })
      );

      return this;
    }

  , enterEditMode: function(){
      this.$el.addClass('editing');

      return this;
    }

  , exitEditMode: function(){
      this.$el.removeClass('editing');

      return this;
    }
  });

})( window );