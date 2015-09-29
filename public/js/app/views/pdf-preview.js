define(function(require){
  'use strict';

  var utils         = require('utils');
  var Hbs           = require('handlebars');
  var spinner       = require('spinner');
  var notify        = require('notify');

  var exports = utils.View.extend({
    events: function () {
      return {
        'click .rebuild-pdf':     utils.debounce(this.onRebuildPdfClick, 5000, { leading: true, trailing: false })
      , 'click .refresh':         'onRefreshClick'
      }
    }

  , initialize: function( options ){
      this.options = utils.defaults( options || {}, {
        orderId:  this.$el.data('order-id')
      , type:     this.$el.data('type')
      });

      if ( !this.options.orderId ){
        throw new Error('Missing required property: `orderId`');
      }

      if ( !this.options.type ){
        throw new Error('Missing required property: `type`');
      }

      return this;
    }

  , showAlert: function( msg ){
      var $el = this.$el.find('.pdf-preview-alert');
      $el.text( msg );
      $el.css( 'opacity', 1 );

      return this;
    }

  , hideAlert: function(){
      var $el = this.$el.find('.pdf-preview-alert');
      $el.css( 'opacity', 0 );

      return this;
    }

  , onRebuildPdfClick: function( e ){
      if (e) {
        e.preventDefault();
      }

      var this_ = this;

      this.showAlert('PDF is rebuilding. Allow 5 to 10 seconds for the changes to take effect.');
      var showInterval = setTimeout( this.hideAlert.bind( this ), 4000 );

      utils.ajax({
        type: 'POST'
      , url: [ '/api/orders', this.options.orderId, 'rebuild-pdf', this.options.type ].join('/')
      , json: true
      , headers: { 'Content-Type': 'application/json' }
      , error: function(){
          clearInterval( showInterval );
          this_.showAlert('Oh no! Something went wrong. Please refresh and try again.');
          setTimeout( this_.hideAlert.bind( this_ ), 4000 );
        }
      });
    }

  , onRefreshClick: function( e ){
      e.preventDefault();

      var $iframe = this.$el.find('iframe');
      $iframe[0].src = $iframe[0].src;
    }
  });

  return exports;
});