(function( exports ){

  var EditOptionsGroupView = exports.EditOptionsGroupView = Backbone.View.extend({
    template: Handlebars.partials.edit_item_options_group

  , events: {
      'click .btn-edit':          'onEditClick'
    }

  , initialize: function( options ){
      this.model.on( 'destroy', this.onModelDestroy, this );
      return this;
    }

  , render: function(){
      this.setElement(
        this.template( this.model.toJSON() )
      );

      this.$btnEdit = this.$el.find('.btn-edit');

      return this;
    }

  , toggleEditMode: function(){
      return this[ this.editing ? 'enterEditMode' : 'exitEditMode' ]();
    }

  , enterEditMode: function(){
      if ( this.editing ) return this;

      this.editing = true;
      this.$el.addClass('editing');

      return this;
    }

  , exitEditMode: function(){
      if ( !this.editing ) return this;

      this.editing = false;
      this.$el.removeClass('editing');

      return this;
    }

  , onModelDestroy: function(){
      this.remove();
    }

  , onEditClick: function( e ){
      this.toggleEditMode();
    }
  });

})( window );