/**
 * Audit View
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var FormView = require('../form-view-2');

  return FormView.extend({
    events: {
      'submit [role="create-form"]': 'onCreateSubmit'
    , 'click [role="remove"]':      'onRemoveClick'
    }

  , initialize: function( options ){
      if ( !options.collection ){
        throw new Error('Must provide an instance of Collection');
      }

      if ( !options.template ){
        throw new Error('Must provide a template');
      }

      this.collection = options.collection;
      this.template   = options.template;

      this.collection.on( 'sync', this.render.bind( this ) );
      this.collection.on( 'destroy', this.render.bind( this ) );
    }

  , render: function(){
      var html = this.template({
        items: this.collection.sort().toJSON()
      });

      this.$el.html( html );

      return this;
    }

  , onCreateSubmit: function( e ){
      e.preventDefault();

      var model = this.collection.create( this.getModelData() );

      if ( model.validationError ){
        return this.displayErrors( model.validationError );
      }
    }

  , onRemoveClick: function( e ){
      var model = this.collection.get( +$(e.currentTarget).data('id') );
      model.destroy();
    }
  });
});