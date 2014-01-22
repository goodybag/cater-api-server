define(function(require){
  var utils = require('utils');

  return utils.View.extend({
    tagName: 'table'

  , events: {
      'click .item-delete': 'onItemDeleteClick'
    , 'click .item-edit':   'onItemEditClick'
    }

  , initialize: function( options ){
      this.collection = options.collection;
      this.template   = options.template;

      this.collection.on( 'change', this.onCollectionChange, this );
      this.collection.on( 'add',    this.onCollectionChange, this );
      this.collection.on( 'remove', this.onCollectionChange, this );

      return this;
    }

  , render: function(){
      this.$el.html(
        this.template({
          collection: this.collection.toJSON()
        })
      );

      return this;
    }

  , getModelFromEvent: function( e ){
      while ( e.target.tagName !== 'TR' ) e.target = e.target.parentElement;
      return this.collection.get( utils.dom( e.target ).data('id') );
    }

  , onCollectionChange: function(){
      this.render();
    }

  , onItemDeleteClick: function( e ){
      while ( e.target.tagName !== 'TR' ) e.target = e.target.parentElement;
      var id = utils.dom( e.target ).data('id');
      if ( id ) this.collection.del( id );
      e.target.remove();
    }

  , onItemEditClick: function( e ){
      if ( this.options.onItemEditClick ){
        this.options.onItemEditClick.call( this, this.getModelFromEvent( e ), e );
      }
    }
  });
});