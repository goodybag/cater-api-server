/**
 * Dependencies:
 */

define(function(require, exports, module) {
  var utils = require('utils');
  var Backbone = require('backbone');
  var EditOptionsSetView = require('./edit-options-set-view');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    template: Handlebars.partials.edit_options_sets

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
        var id = $(this).data('id');

        new EditOptionsSetView({
          el: this
        , model: _( this_.model.get('options_sets') ).find( function( set ){
            return set.id == id;
          })
        });
      });

      this.$optionGroups = this.$el.find('.option-groups');
      this.$optionGroups.sortable();

      this.$el.find('.item-options-table').sortable({
        items: '.option-set-tr-group'
      });

      return this;
    }

  , addNewOptionGroup: function(){
      var view = new EditOptionsSetView({
        model: { name: null, options: [], type: 'checkbox', id: utils.uuid() }
      });

      view.render();
      this.$optionGroups.prepend( view.$el );
      view.$el.find('.options-set-name').focus();

      return this;
    }

  , close: function(){
      this.trigger('close');
    }

    /**
     * Saves the current state of the DOM representation of options sets
     * into the item model
     */
  , save: function( callback ){
      var this_ = this;
      var option_sets = [];

      // Iterate through each option-group pushing the data gathered into
      // the option_sets array
      this.$optionGroups.find('.option-group').each( function( i ){
        // TODO: Validate this chit
        var $group = $(this);
        var option_set = {
          name:     $group.find('.options-set-name').val()
        , type:     $group.find('.option-group-type input:checked').val()
        , options:  []
        };

        // Add in checkbox selected min/max
        if ( option_set.type === 'checkbox' ){
          ['selected_min', 'selected_max'].forEach( function( field ){
            option_set[ field ] = $group.find('[name="' + field + '"]').val();
            option_set[ field ] = option_set[ field ].trim();
            option_set[ field ] = parseInt( option_set[ field ] );

            if ( isNaN( option_set[ field ] ) ){
              option_set[ field ] = 0;
            }
          });
        }

        option_sets.push( option_set );

        // If the group is not new, attach the old ID
        if ( $group.data('id') ) option_set.id = $group.data('id');

        $group.find('.option-set-tr-group').each( function( i ){
          var $option = $(this);

          var option_set_option = {
            name:           $option.find('.options-set-option-name').val()
          , price:          utils.getPrice( $option.find('.options-set-option-price') )
          , default_state:  $option.find('.options-set-option-default:checked').length > 0
          , description:    $option.find('[name="description"]').val()
          , tags:           _.pluck($option.find('.options-set-tags input:checked'), 'value')
          };

          // If the option is not new, attach the old ID
          if ( $option.data('id') ) option_set_option.id = $option.data('id');

          option_set.options.push( option_set_option );
        });
      });

      this.model.set( 'options_sets', option_sets );

      this.model.save(null, {
        wait: true
      , success: function( results ){ callback( null, results ); }
      , error: callback
      });

      if ( this.model.validationError ) return callback( this.model.validationError );
    }

  , onNewGroupClick: function( e ){
      this.addNewOptionGroup();
    }

  , onOptionsSetChange: function( model, collection, operation ){
      this.render();
    }

  , onCancelClick: function( e ){
      this.close();
    }

  , onSaveClick: function( e ){
      var this_ = this;

      this.save( function( error ){
        if ( error ) return alert( JSON.stringify( error ) );

        this_.close();
      });
    }
  });
});