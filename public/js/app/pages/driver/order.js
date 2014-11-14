define(function(require){
  var Hbs           = require('handlebars');
  var config        = require('config');
  var utils         = require('utils');
  var flash         = require('flash');

  return Object.create({
    init: function( options ){
      this.options = options;

      utils.domready( this.domready.bind( this ) );
    }

  , domready: function(){
      utils.dom('#accept-decline [data-response]').click( function( e ){
        var val = !!$( e.currentTarget ).data('response');
        this.setRequestReponse( val );
      }.bind( this ));
    }

  , setRequestReponse: function( response, callback ){
      if ( typeof response !== 'boolean' ){
        throw new Error('Invalid argument for `response`');
      }

      utils.ajax({
        type:     'POST'
      , url:      [ '/api/orders'
                  , this.options.order.id
                  , 'driver-requests'
                  , this.options.driver_requests.id
                  ].join('/')
      , json:     true
      , headers:  { 'Content-Type': 'application/json' }
      , data:     JSON.stringify({ response: response })
      })
    }
  });
});