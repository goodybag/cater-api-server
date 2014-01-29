define(function(require){
  var utils     = require('utils');
  var RowView   = require('./table-row-view');

  return utils.View.extend({
    tagName: 'table'

  , events: {

    }

  , initialize: function( options ){
      this.options = options;

      if ( !options.collection )
        throw new Error('TableView.initialize - first argument requires property `collection`');
      if ( !options.template )
        throw new Error('TableView.initialize - first argument requires property `template`');
      if ( !options.rowTemplate )
        throw new Error('TableView.initialize - first argument requires property `rowTemplate`');

      this.collection   = options.collection;
      this.template     = options.template;
      this.rowTemplate  = options.rowTemplate;
      this.RowView      = options.RowView || RowView;

      this.collection.on( 'reset',  this.onCollectionReset, this );
      this.collection.on( 'add',    this.onCollectionReset, this );
      this.collection.on( 'remove', this.onCollectionReset, this );

      return this;
    }

  , render: function(){
      var this_   = this;
      var $els    = $();
      var RowView = this.RowView;
      var options = utils.clone( this.options );

      options.template = options.rowTemplate;

      this.children = [];

      this.$el.html(
        this.template({
          collection: this.collection.toJSON({ cid: true })
        , options:    this.options
        })
      );

      this.collection.each( function( model ){
        var child = new RowView( utils.extend({
          model: model
        }, options ));

        $els = $els.add( child.render().$el );

        this_.children.push( child );
      });

      this.$el.find('tbody').append( $els );

      return this;
    }

  , getModelFromEvent: function( e ){
      var el = e.target;
      while ( el.tagName !== 'TR' ) el = el.parentElement;
      return this.collection.get({ cid: utils.dom( el ).data('cid') });
    }

  , updateModels: function(){
      this.children.forEach( function( child ){
        child.updateModelWithDom();
      });
    }

  , onCollectionReset: function(){
      this.render();
    }
  });
});