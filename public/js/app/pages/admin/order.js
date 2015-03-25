define(function(require){
  var $       = require('jquery-loaded');
  var notify  = require('notify');
  var utils   = require('utils');
  var flash   = require('flash');

  var Views = {
    NotificationHistoryTable:     require('app/views/notification-history-table')
  , NotificationsTable:           require('app/views/notifications-table')
  , PdfPreview:                   require('app/views/pdf-preview')
  };

  var page = {
    typeChangeFunnies: [
      'You are very handsome.'
    , 'Have a great day!'
    , 'You. Are. The. Best.'
    , 'I like what you\'ve done with your hair'
    , 'Remember the old days?'
    , 'Please click softer next time :('
    , 'You rock!'
    , 'Bet, let, get, pet, Boba Fet'
    , 'You win... This time.'
    ]

  , state: new utils.Model()

  , init: function( options ){
      if ( !options.order ){
        throw new Error('Missing required property: `order`');
      }

      page.order = options.order;

      page.state.set( 'order_type', options.order.type );
      page.state.set( 'restaurant_location_id', options.order.restaurant_location_id );

      page.state.on( 'change', page.onStateChange );

      page.notificationHistory  = new Views.NotificationHistoryTable({ order: options.order })
      page.notifications        = new Views.NotificationsTable({ order: options.order })

      page.fetchAndRenderHistory();
      page.fetchAndRenderNotifications();

      page.notifications.on( 'send', page.onNotificationsSend );
      page.notificationHistory.on( 'highlight', page.onHighlight );

      $(function(){
        $('.navbar').navbar({ toggleText: false, toggleLogin: false });

        page.notificationHistory.setElement(
          $('#notifications-history-table')
        ).render();

        page.notifications.setElement(
          $('#notifications-table')
        ).render();

        $('.pdf-preview').each( function(){
          new Views.PdfPreview({ el: this });
        });

        $('[name="order_type"]').change( function( e ){
          var order = { type: $(this).val() };

          page.updateOrder( order, function( error, order ){
            if ( error ){
              return flash.info( 'Error :(', 1000 );
            }

            page.flashSuccess();

            page.state.set( 'order_type', order.type );
            page.state.trigger('order_type:change');
          });
        });

        $('[name="delivery_service_id"]').change( function( e ){
          page.state.set( 'order_courier', +$(this).val() );
          page.state.trigger('order_courier:change');
        });

        $('[name="restaurant_location_id"]').change( function( e ){
          page.state.set( 'restaurant_location_id', +$(this).val() );
        });

        $('[role="save"]').click( function( e ){
          e.preventDefault();

          page.saveOrder( function( error ){
            if ( error ){
              return page.flashError( error );
            }

            return page.flashSuccess();
          });
        });
      });
    }

  , saveOrder: function( callback ){
      var props = {
        type: page.state.get('order_type')
      , restaurant_location_id: page.state.get('restaurant_location_id')
      };

      // Index of because of the whole `silent` thing
      if ( props.type && props.type.indexOf('courier') > -1 ){
        props.delivery_service_id = page.state.get('order_courier');
      }

      return page.updateOrder( props, callback );
    }

    // Because I'm too lazy to fulfill all required properties on the Order Model
  , updateOrder: function( props, callback ){
      var silent = typeof props.type === 'string' && props.type.indexOf('silent') >= 0;
      if (silent) props.type = props.type.replace('silent', '').trim();
      $.ajax({
        type: 'PUT'
      , url: '/api/orders/' + (silent ? 'silent/' : '') + page.order.get('id')
      , json: true
      , headers: { 'Content-Type': 'application/json' }
      , data: JSON.stringify( props )
      , success: function( order ){
          return callback( null, order );
        }
      , error: callback
      });
    }

  , getHistory: function( callback ){
      $.ajax({
        type: 'GET'
      , url: ['/api/orders', page.order.get('id'), 'notifications-history'].join('/')
      , json: true
      , headers: { 'Content-Type': 'application/json' }
      , success: function( notes ){
          return callback( null, notes );
        }
      , error: callback
      });
    }

  , getAvailable: function( callback ){
      $.ajax({
        type: 'GET'
      , url: ['/api/orders', page.order.get('id'), 'notifications'].join('/')
      , json: true
      , headers: { 'Content-Type': 'application/json' }
      , success: function( notes ){
          return callback( null, notes );
        }
      , error: callback
      });
    }

  , fetchAndRenderHistory: function(){
      page.getHistory( function( error, items ){
        if ( error ){
          return page.flashError( error );
        }

        page.notificationHistory.setItems( items );
      });
    }

  , fetchAndRenderNotifications: function(){
      page.getAvailable( function( error, items ){
        if ( error ){
          return page.flashError( error );
        }

        page.notifications.setItems( items );
      });
    }

  , updateCourierServiceSelector: function(){
      $('.form-group-courier').toggleClass(
        'hide'
      , page.state.get('order_type') !== 'courier'
      );
    }

  , flashSuccess: function(){
      flash.info([
        "It's set!<br>"
      , '<small class="really-small">'
      , page.typeChangeFunnies[ ~~( Math.random() * page.typeChangeFunnies.length ) ]
      , '</small>'
      ].join(''));
    }

  , flashError: function( error ){
      console.error( error );
      flash.info( 'Error :( <br> Press CMD+Alt+J', 1000 );
    }

  , onNotificationsSend: function(){
      page.fetchAndRenderHistory();
    }

  , onHighlight: function( cid, e, view ){
      $('.nav-tabs [href="#notifications-available"]').trigger('click');
      var $tds = page.notifications.$el.find( '#notification-' + cid + ' > td' );
      $tds.addClass('highlight');
      $tds.eq(0).one( 'animationend', $tds.removeClass.bind( $tds, 'highlight') );
    }

  , onStateChange: function( state ){
      var handlers = {
        order_type: function(){
          page.updateCourierServiceSelector();
        }
      };

      Object.keys( state.changed )
        .filter( function( key ){
          return typeof handlers[ key ] === 'function';
        })
        .forEach( function( key ){
          handlers[ key ]();
        });

      $('.form-group-save').removeClass('hide');
    }
  };

  return page;
});
