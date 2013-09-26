/**
 * Dependencies: EditOptionsGroupView
 *               OptionsGroupModel
 */

(function( exports ){

  var EditOptionsView = exports.EditOptionsView = Backbone.View.extend({
    template: Handlebars.partials.edit_item_options

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

  , addNewOptionGroup: function( model ){
      model = model || new OptionsGroupModel( null, { baseModel: this.model });

      var groupView = new EditOptionsGroupView({ model: model });
      groupView.render();
      groupView.enterEditMode();
      this.$el.prepend( groupView.$el );

      return this;
    }
  });
})( window );