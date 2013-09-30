/**
 * Dependencies:
 */

(function( exports ){

  var EditOptionsView = exports.EditOptionsView = Backbone.View.extend({
    template: Handlebars.partials.edit_options_sets

  , tagName: 'tr'
  , className: 'edit-options'

  , events: {
      'click .btn-new-group':     'onNewGroupClick'
    , 'click .btn-cancel':        'onCancelClick'
    , 'click .btn-save':          'onSaveClick'
    }

  , initialize: function( options ){
      return this;
    }

  , render: function(){
      var this_ = this;

      this.$el.html(
        this.template({
          model: this.model.toJSON()
        })
      );

      this.$el.find('.option-group').each( function(){
        new EditOptionsSetView({ el: this });
      });

      this.$optionGroups = this.$el.find('.option-groups');

      return this;
    }

  , addNewOptionGroup: function(){
      var view = new EditOptionsSetView({
        model: { name: null, options: [] }
      });

      view.render();

      this.$optionGroups.prepend( view.$el );

      view.$el.find('.options-set-name').focus();

      return this;
    }

  , onNewGroupClick: function( e ){
      this.addNewOptionGroup();
    }

  , onOptionsSetChange: function( model, collection, operation ){
      this.render();
    }

  , onCancelClick: function( e ){
      this.trigger('cancel');
    }

  , onSaveClick: function( e ){

    }

  , onNewOptionClick: function( e ){

    }
  });
})( window );