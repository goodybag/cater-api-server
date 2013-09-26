/**
 * Dependencies: EditOptionsGroupView
 */

(function( exports ){

  var EditOptionsView = exports.EditOptionsView = Backbone.View.extend({
    template: Handlebars.partials.edit_item_options

  , tagName: 'tr'
  , className: 'edit-options'

  , events: {
      'click .new-option-group': 'onNewOptionGroupClick'
    }

  , initialize: function( options ){
      this.model.get('options_sets').on( 'add remove', this.onOptionsSetChange, this );

      return this;
    }

  , render: function(){
      var this_ = this;

      this.$el.html(
        this.template({
          model: this.model.toJSON()
        })
      );

      // Attach View to each option group
      this.$el.find('.option-group').each(function(){
        var $el = $(this);

        // Find the appropriate model based on the ID from the template
        var view = new EditOptionsGroupView({
          model: this_.model.get('options_sets').get( $el.data('id') )
        });
      });

      return this;
    }

  , addNewOptionGroup: function( model ){
      var model = model || new OptionsSetModel({
        name: 'New Options Group'
      });

      var groupView = new EditOptionsGroupView({ model: model });

      this.model.get('options_sets').add( model, { silent: true } );

      groupView.render();
      groupView.enterEditMode();

      var $el = $('<div class="col-lg-6"></div>').append( groupView.$el );

      this.$el.find('.option-groups').prepend( $el );

      return this;
    }

  , onNewOptionGroupClick: function( e ){
      this.addNewOptionGroup();
    }

  , onOptionsSetChange: function( model, collection, operation ){
      this.render();
    }
  });
})( window );