define(function(require){
  var $       = require('jquery-loaded');
  var notify  = require('notify');
  var utils   = require('utils');
  var flash   = require('flash');
  var Hbs     = require('handlebars');
  var moment  = require('moment');

  var InternalNotesCollection = require('app/collections/order-internal-notes');

  var Views = {
    NotificationHistoryTable:     require('app/views/notification-history-table')
  , NotificationsTable:           require('app/views/notifications-table')
  , PdfPreview:                   require('app/views/pdf-preview')
  , AuditView:                    require('app/views/admin/audit-view')
  };

  var page = {
    fieldsThatRefreshThePageWhenChanged: [
      'user_id', 'restaurant_id'
    ]

  , init: function( options ){
      if ( !options.order ){
        throw new Error('Missing required property: `order`');
      }

      page.order = options.order;
      page.state = new utils.Model();

      // page.state.set( 'type', options.order.get('type') );
      // page.state.set( 'restaurant_location_id', options.order.get('restaurant_location_id') );

      page.state.on( 'change', page.onStateChange );

      page.notificationHistory  = new Views.NotificationHistoryTable({ order: options.order })
      page.notifications        = new Views.NotificationsTable({ order: options.order })

      page.internalNotesView = new Views.AuditView({
        collection: new InternalNotesCollection( page.order.get('internal_notes'), {
                      order_id: page.order.id
                    })
      , template:   Hbs.partials.order_internal_notes
      });

      page.fetchAndRenderHistory();
      page.fetchAndRenderNotifications();

      page.notifications.on( 'send', page.onNotificationsSend );
      page.notificationHistory.on( 'highlight', page.onHighlight );

      $(function(){
        $('[data-role="popover"]').gb_popover();

        $('.navbar').navbar({ toggleText: false, toggleLogin: false });

        var orderActualDT = page.order.get('actual_delivery_datetime');
        if(orderActualDT && moment(orderActualDT).hour() >= 12) {
          $('[name="actual-dt-period"]').val('pm');
        };

        page.notificationHistory.setElement(
          $('#notifications-history-table')
        ).render();

        page.notifications.setElement(
          $('#notifications-table')
        ).render();

        page.internalNotesView.render();
        $('#internal-notes .panel-body').append( page.internalNotesView.$el );

        $('.pdf-preview').each( function(){
          new Views.PdfPreview({ el: this });
        });

        $('[name="type"]').change( function( e ){
          page.state.set( 'type', $(this).val() );
        });

        $('[name="delivery_service_id"]').change( function( e ){
          if ( $(this).val() === 'null' ){
            flash.info([
              'Wait!<br><small class="really-small">You can\'t do that!</small>'
            ]);
          }

          page.state.set( 'delivery_service_id', +$(this).val() );
        });

        $('[name="restaurant_location_id"]').change( function( e ){
          page.state.set( 'restaurant_location_id', +$(this).val() );
        });

        $('[name="order_status"]').change(function (e) {
          var silent = !!$(this).find(':selected').data('silent');
          page.updateOrder({ status: e.target.value },{ silent: silent }, flash.successOrError.bind( flash ));
        });

        $('[name="payment_status"]').change(function (e) {
          var status = e.target.value || null;
          if (status === null) {
            flash.info([
              'Warning!<br><small class="really-small">'
            , 'Changing payment status to unprocessed will attempt '
            , 'to recharge the credit card!</small>'
            ].join(''));
          }

          page.state.set({ payment_status: status });
        });

        $('[name="payment_method_id"]').change( function( e ){
          var pmid = isNaN(e.target.value) ? null : e.target.value;
          page.state.set({ payment_method_id: pmid });
        });

        $('[role="save"]').click( function( e ){
          e.preventDefault();

          page.saveOrder( flash.successOrError.bind( flash ) );
        });

        $('[role="save-actual-dt"]').click(function( e ) {
          e.preventDefault();

          var hour   = parseInt($('[name=actual-dt-hour]').val());
          var min    = $('[name=actual-dt-min]').val();
          var period = $('[name=actual-dt-period]').val();

          if(hour && min) {
            if( period === "pm" && hour < 12 ) {
              hour = parseInt(hour) + 12;
            };

            if( hour === 12 && period === "am" ) { hour = 0 };

            var datetime = page.order.get('datetime');
            var actualdt = moment(datetime)
              .hour(hour)
              .minute(min)
              .format('YYYY-MM-DD HH:mm:ss');

            page.updateOrder({ actual_delivery_datetime: actualdt }, flash.successOrError.bind( flash ));
          }
        });

        $('#restaurant-selector').delegate( '[data-id]', 'click', function( e ){
          e.preventDefault();
          $('#restaurant-selector > [data-role="popover"]').data('gb.popover').close();
          page.state.set({ restaurant_id: +$(this).data('id') });
        });

        $('#user-selector').delegate( '[data-id]', 'click', function( e ){
          e.preventDefault();
          $('#user-selector > [data-role="popover"]').data('gb.popover').close();
          page.state.set({ user_id: +$(this).data('id') });
        });

        $('[name="courier_tracking_id"]').keyup( function( e ){
          var v = $(this).val();

          if ( v !== page.order.get('courier_tracking_id') ){
            page.state.set( 'courier_tracking_id', v );
          }
        });

        $('[name="waive_transaction_fee"]').change( function( e ){
          var v = $(this).val();

          if ( v !== page.order.get('waive_transaction_fee') ){
            page.state.set( 'waive_transaction_fee', v );
          }
        });
      });
    }

  , saveOrder: function( callback ){
      var props = page.state.toJSON();

      return page.updateOrder( props, function( error ){
        if ( error ) return callback( error );

        callback();

        // Reset state
        page.state.clear({ silent: true });

        page.onSave();

        var shouldRefresh = utils.intersection(
          Object.keys( props ), page.fieldsThatRefreshThePageWhenChanged
        ).length > 0;

        if ( shouldRefresh ){
          document.location.reload();
        }
      });
    }

    // Because I'm too lazy to fulfill all required properties on the Order Model
  , updateOrder: function( props, options, callback ){
      if (utils.isFunction(options)) {
        callback = options;
        options = {};
      }

      utils.defaults(options, {
        silent: false
      });

      var silent = typeof props.type === 'string' && props.type.indexOf('silent') >= 0;
      if (silent) props.type = props.type.replace('silent', '').trim();

      // shim silent hack
      silent = silent || options.silent;

      $.ajax({
        type: 'PUT'
      , url: '/api/orders/' + (silent ? 'silent/' : '') + page.order.get('id')
      , json: true
      , headers: { 'Content-Type': 'application/json' }
      , data: JSON.stringify( props )
      , success: function( order ){
          if ( !silent ) return callback( null, order );
          utils.async.parallel([
            page.buildPdf.bind(page, order.id, 'receipt')
          , page.buildPdf.bind(page, order.id, 'manifest')
          ], callback);
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

  , buildPdf: function ( orderId, pdfType, callback ) {
      $.ajax({
        type: 'POST'
      , url: ['/api/orders', orderId, 'rebuild-pdf', pdfType].join('/')
      , json: true
      , headers: { 'Content-Type': 'application/json' }
      , success: function ( res ) {
          return callback( null, res );
        }
      , error: callback
      });
    }

  , fetchAndRenderHistory: function(){
      page.getHistory( function( error, items ){
        if ( error ){
          return flash.error( error );
        }

        page.notificationHistory.setItems( items );
      });
    }

  , fetchAndRenderNotifications: function(){
      page.getAvailable( function( error, items ){
        if ( error ){
          return flash.error( error );
        }

        page.notifications.setItems( items );
      });
    }

  , updateCourierServiceSelector: function(){
      $('.form-group-courier, #courier-tracking-id-row').toggleClass(
        'hide'
      , page.state.get('type').indexOf('courier') === -1
      );
    }

  , onNotificationsSend: function(){
      page.fetchAndRenderHistory();
    }

  , onHighlight: function( cid, e, view ){
      $('.nav-tabs [href="#notifications-available"]').trigger('click');
      var $tds = page.notifications.$el.find( '#notification-' + cid + ' > td' );
      $tds.addClass('highlight');
      $tds.eq(0).one( 'animationend', $tds.removeClass.bind( $tds, 'highlight') );
      // scroll to the middle of screen
      $('html, body').animate({
        scrollTop: $tds.offset().top - Math.floor(window.innerHeight/2)
      }, 200);
    }

  , onStateChange: function( state ){
      var handlers = {
        type: function(){
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

  , onSave: function(){
      $('.form-group-save').addClass('hide');
    }
  };

  return page;
});
