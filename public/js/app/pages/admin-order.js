define(function(require){
  var $       = require('jquery-loaded');
  var notify  = require('notify');
  var order   = require('data/order');

  var Views = {
    NotificationHistoryTable:     require('app/views/notification-history-table')
  , NotificationsTable:           require('app/views/notifications-table')
  };

  var page = {
    notificationHistory: new Views.NotificationHistoryTable()
  , notifications: new Views.NotificationsTable()

  , init: function(){
      page.getHistory( function( error, items ){
        if ( error ){
          return notify.error( error );
        }

        page.notificationHistory.setItems( items );
      });

      page.getAvailable( function( error, items ){
        if ( error ){
          return notify.error( error );
        }

        page.notifications.setItems( items );
      });

      $(function(){
        $('.navbar').navbar({ toggleText: false, toggleLogin: false });

        page.notificationHistory.setElement( $('#notifications-history-table') );
        page.notifications.setElement( $('#notifications-table') );
      });
    }

  , getHistory: function( callback ){
      $.ajax({
        type: 'GET'
      , url: ['/api/orders', order.get('id'), 'notifications-history'].join('/')
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
      , url: ['/api/orders', order.get('id'), 'notifications'].join('/')
      , json: true
      , headers: { 'Content-Type': 'application/json' }
      , success: function( notes ){
          return callback( null, notes );
        }
      , error: callback
      });
    }
  };

  return page;
});