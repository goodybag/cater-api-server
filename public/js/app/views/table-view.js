define(function(require){
  var utils = require('utils');

  return utils.View.extend({
    tagName: 'table'

  , events: {
      'click .item-delete': 'onItemDeleteClick'
    , 'click .item-edit':   'onItemEditClick'
    , 'input [name]':       'onInputChange'
    }

  , initialize: function( options ){
      this.options = options;

      this.collection = options.collection;
      this.template   = options.template;

      this.collection.on( 'reset',  this.onCollectionChange, this );
      this.collection.on( 'add',    this.onCollectionChange, this );
      this.collection.on( 'remove', this.onCollectionChange, this );

      return this;
    }

  , render: function(){
      this.$el.html(
        this.template({
          collection: this.collection.toJSON({ cid: true })
        , options:    this.options
        })
      );

      return this;
    }

  , getModelFromEvent: function( e ){
      var el = e.target;
      while ( el.tagName !== 'TR' ) el = el.parentElement;
      return this.collection.get({ cid: utils.dom( el ).data('cid') });
    }

  , onCollectionChange: function(){
      this.render();
    }

  , onItemDeleteClick: function( e ){
      while ( e.target.tagName !== 'TR' ) e.target = e.target.parentElement;
      var cid = utils.dom( e.target ).data('cid');
      if ( cid ) this.collection.del({ cid: cid });
      e.target.remove();
    }

  , onItemEditClick: function( e ){
      if ( this.options.onItemEditClick ){
        this.options.onItemEditClick.call( this, this.getModelFromEvent( e ), e );
      }
    }

  , onInputChange: function( e ){
      var model = this.getModelFromEvent( e );
      if ( !model ) return;

      model.set(
        e.target.name
      , e.target.type === 'number' ? +e.target.value : e.target.value
      );
    }
  });
});