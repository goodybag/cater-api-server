define(function(require){
  'use strict';

  var utils         = require('utils');
  var Hbs           = require('handlebars');
  var orderNotifier = require('order-notifier');
  var spinner       = require('spinner');
  var notify        = require('notify');

  var exports = utils.View.extend({
    events: {
      'click .btn-options': 'onBtnOptionsClick'
    , 'click .btn-send':    'onBtnSendClick'
    }

  , template: Hbs.partials.notifications_table

  , initialize: function( options ){
      this.options = options || {};
      this.items = this.options.items || [];

      utils.enforceRequired( this.options, [
        'order'
      ]);

      return this;
    }

  , setItems: function( items ){
      this.items = items;
      this.render();
      return this;
    }

  , render: function(){
      this.$el.html( this.template({ items: this.items }) );
      this.$el.find('.btn-preview').preview({
        width: 630
      , height: 700
      });

      this.$el.find('.btn-toggle').toggler();

      return this;
    }

  , expandOptions: function( cid ){
      var this_ = this;
      var $tr   = this.$el.find( '#notification-' + cid );
      var item  = this.items.filter( function( item ){
        return item.cid == cid;
      })[0];

      if ( !item.params ) item.params = {};

      if ( this.rowExpander ){
        this.rowExpander.collapse();
      }

      this.rowExpander = $tr.rowExpand({
        template: Hbs.partials.notification_table_options.bind( Hbs, item )
      , animate: false
      });

      this.rowExpander.expand();

      // Update the preview URL
      this.rowExpander.$wrapper.find('input').keyup( function( e ){
        item.params[ e.target.name ] = e.target.value;
        this_.onItemParamsChange( $tr, item );
      });

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

  , onBtnSendClick: function( e ){
      spinner.start();

      var this_   = this;
      var $target = $( e.target );
      var cid     = $target.data('cid');
      var $tr     = this.$el.find( '#notification-' + cid );
      var item    = this.items.filter( function( item ){
        return item.cid == cid;
      })[0];

      orderNotifier.send( item.id, this.options.order.get('id'), item.params, function( error ){
        spinner.stop();
        this_.trigger( 'send', item, this_ );
        if ( error ) return notify.error( error );

        var oldText = $target.text();
        $target.text('Success!');
        setTimeout( function(){ $target.text( oldText ); }, 3000 );
      });
    }

  , onItemParamsChange: function( $tr, item ){
      $tr.find('.btn-preview').attr( 'href', [
        item.email.url
      , utils.queryParams( item.params )
      ].join('') );
    }
  });

  return exports;
});
