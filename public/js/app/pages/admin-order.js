define(function(require){
  var $       = require('jquery-loaded');
  var order   = require('data/order');

  var Views = {
    NotificationHistory: require('app/views/notification-history')
  };

  var page = {
    notificationHistory: new Views.NotificationHistory()

  , init: function(){
      $.ajax({
        type: 'GET'
      , url: ['/api/orders', order.get('id'), 'notifications-history'].join('/')
      , json: true
      , headers: { 'Content-Type': 'application/json' }
      , success: function( notes ){
          page.notificationHistory.setItems( notes );
        }
      });

      $(function(){
        $('.navbar').navbar({ toggleText: false, toggleLogin: false });

        page.notificationHistory.setElement(
          $('#notifications-history-table')
        );
      });
    }
  };

  return page;
});