define(function(require){
  var Hbs           = require('handlebars');
  var config        = require('config');
  var utils         = require('utils');
  var flash         = require('flash');
  var spinner       = require('spinner');

  return Object.create({
    init: function( options ){
      this.options = options;

      utils.domready( this.domready.bind( this ) );
    }

  , domready: function(){
      utils.dom('#accept-decline [data-response]').click( function( e ){
        var val = !!$( e.currentTarget ).data('response');
        this.setOrderRequestReponse( val );
      }.bind( this ));
    }

  , setOrderRequestReponse: function( response, callback ){
      if ( typeof response !== 'boolean' ){
        throw new Error('Invalid argument for `response`');
      }

      spinner.start();

      utils.ajax({
        type:     'POST'
      , url:      [ '/api/orders'
                  , this.options.order.id
                  , 'driver-requests'
                  , this.options.order_driver_request.id
                  , 'set-response'
                  ].join('/')
      , json:     true
      , headers:  { 'Content-Type': 'application/json' }
      , data:     JSON.stringify({ response: response })
      })
      .always( function(){
        spinner.stop();
      })
      .fail( function( xhr, status, error ){
        flash.info(':( Ruh oh<br><small class="really-small">Something went wrong</small>');
      })
      .done( function( data, status, xhr ){
        window.location.reload();
      });
    }
  });
});