define(function(require){
  var $       = require('jquery-loaded');
  var notify  = require('notify');
  var utils   = require('utils');

  var Views = {
    NotificationHistoryTable:     require('app/views/notification-history-table')
  , NotificationsTable:           require('app/views/notifications-table')
  , PdfPreview:                   require('app/views/pdf-preview')
  };

  var page = {
    init: function( options ){
      if ( !options.order ){
        throw new Error('Missing required property: `order`');
      }

      page.order = options.order;

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
          return notify.error( error );
        }

        page.notificationHistory.setItems( items );
      });
    }

  , fetchAndRenderNotifications: function(){
      page.getAvailable( function( error, items ){
        if ( error ){
          return notify.error( error );
        }

        page.notifications.setItems( items );
      });
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
  };

  return page;
});