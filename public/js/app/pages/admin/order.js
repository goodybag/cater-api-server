define(function(require){
  var $       = require('jquery-loaded');
  var notify  = require('notify');
  var utils   = require('utils');
  var flash   = require('flash');
  var Hbs     = require('handlebars');

  var InternalNotesCollection = require('app/collections/order-internal-notes');

  var Views = {
    NotificationHistoryTable:     require('app/views/notification-history-table')
  , NotificationsTable:           require('app/views/notifications-table')
  , PdfPreview:                   require('app/views/pdf-preview')
  , AuditView:                    require('app/views/admin/audit-view')
  };

  var page = {
    successFunnies: [
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

      page.state.set( 'type', options.order.get('type') );
      page.state.set( 'restaurant_location_id', options.order.get('restaurant_location_id') );

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
          if (status === null) alert('Changing payment status to unprocessed will attempt to recharge the credit card!');
          page.updateOrder({ payment_status: status }, flash.successOrError.bind( flash ));
        });

        $('[name="payment_method_id"]').change( function( e ){
          var pmid = isNaN(e.target.value) ? null : e.target.value;
          page.updateOrder({ payment_method_id: pmid }, flash.successOrError.bind( flash ));
        });

        $('[role="save"]').click( function( e ){
          e.preventDefault();

          page.saveOrder( flash.successOrError.bind( flash ) );
        });

        $('#restaurant-selector').delegate( '[data-id]', 'click', function( e ){
          e.preventDefault();

          page.updateOrder( { restaurant_id: +$(this).data('id') }, function( error ){
            flash.successOrError( error );

            if ( !error ){
              document.location.reload();
            }
          });
        });

        $('#user-selector').delegate( '[data-id]', 'click', function( e ){
          e.preventDefault();

          page.updateOrder( { user_id: +$(this).data('id') }, function( error ){
            flash.successOrError( error );

            if ( !error ){
              document.location.reload();
            }
          });
        });

        $('[name="courier_tracking_id"]').keyup( function( e ){
          var v = $(this).val();

          if ( v !== page.order.get('courier_tracking_id') ){
            page.state.set( 'courier_tracking_id', v );
          }
        });
      });
    }

  , saveOrder: function( callback ){
      return page.updateOrder( page.state.toJSON(), function( error ){
        if ( error ) return callback( error );

        callback();

        // Reset state
        page.state = new utils.Model();

        page.onSave();
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
