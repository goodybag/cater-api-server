define(function(require){
  'use strict';

  var utils = require('utils');
  var Hbs   = require('handlebars');

  var exports = utils.View.extend({
    events: {
      'click .btn-options': 'onBtnOptionsClick'
    }

  , template: Hbs.partials.notifications_table

  , initialize: function( options ){
      this.options = options || {};
      this.items = this.options.items || [];

      return this;
    }

  , setItems: function( items ){
      this.items = items;
      this.render();
      return this;
    }

  , render: function(){
      this.$el.html( this.template({ items: this.items } ) );
      this.$el.find('.btn-preview').preview({
        width: 630
      , height: 700
      });
      return this;
    }

  , expandOptions: function( cid ){
      var $tr = this.$el.find( '#notification-' + cid );
      var item = this.items.filter( function( item ){
        return item.cid == cid;
      })[0];

      if ( this.rowExpander ){
        this.rowExpander.collapse();
      }

      this.rowExpander = $tr.rowExpand({
        template: Hbs.partials.notification_table_options.bind( Hbs, item )
      , animate: false
      });

      this.rowExpander.expand();

      return this;
    }

  , collapseOptions: function(){
      if ( this.rowExpander ){
        this.rowExpander.collapse();
        delete this.rowExpander;
      }

      return this;
    }

  , onBtnOptionsClick: function( e ){
      if ( this.rowExpander ){
        return this.collapseOptions();
      }

      this.expandOptions( $( e.currentTarget ).data('cid') );
    }
  });

  return exports;
});