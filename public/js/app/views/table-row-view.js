/**
 * TableRowView
 *
 * Utilized by TableView. Do not instantiate on your own unless
 * you know what you're doing!
 *
 * See TableView
 */

define(function(require){
  var utils     = require('utils');
  var Hbs       = require('handlebars');
  var FormView2 = require('./form-view-2');

  return FormView2.extend({
    tagName: 'tr'

  , events: {
      'click .item-edit':   'onItemEditClick'
    , 'input [name]':       'onInputChange'
    , 'click .item-delete': 'onItemDeleteClick'
    }

  , initialize: function( options ){
      this.options = options;

      this.template = options.template;

      this.model.on( 'change',  this.onModelChange, this );
      this.model.on( 'destroy', this.onModelDestroy, this );

      return this;
    }

  , render: function(){
      var $el = utils.dom(
        this.template({
          model:    this.model.toJSON({ cid: true })
        , options:  this.options
        })
      );

      this.setElement( $el[0] );

      return this;
    }

  , onModelChange: function( model, prev ){
      this.updateDomWithModel( model.changed );
    }

  , onItemDeleteClick: function( e ){
      this.model.destroy();
    }

  , onModelDestroy: function(){
      this.remove();
    }

  , onItemEditClick: function( e ){
      if ( this.options.onItemEditClick ){
        this.options.onItemEditClick.call( this, this.model );
      }
    }

  , onInputChange: function( e ){
      this.model.set(
        e.target.name
      , this.getDomValue( e.target.name )
      );
    }
  });
});