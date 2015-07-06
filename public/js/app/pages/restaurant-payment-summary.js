define(function(require){
  var Hbs           = require('handlebars');
  var async         = require('async');
  var utils         = require('utils');
  var moment        = require('moment-timezone');
  var summary       = require('data/payment-summary');
  var items         = require('data/payment-summary-items');
  var orders        = require('data/orders');
  var TableView     = require('views/table-view');
  var DataListView  = require('views/data-list-view');

  var goBack = function(){
    var href = window.location.href;
    window.location.href = href.substring( 0, href.lastIndexOf('/') );
  };

  var dataListId = 'orders-datalist';

  if ( !summary.get('plan') ){
    alert('ERROR! This restaurant does not have a plan, Stan');
  }

  summary.fetch({
    error: function( model, res ){
      if ( res.status === 404 ){
        utils.dom('#main').html([
          '<div style="text-align: center">'
        , '  <h1>404 Not Found</h1>'
        , '  <div>'
        , '    <img src="https://i.imgflip.com/6htm8.jpg" />'
        , '  </div>'
        , '  <a href="'
        , window.location.href.substring( 0, window.location.href.lastIndexOf('/') )
        , '">Go Back to Payment Summaries</a>'
        , '</div>'
        ].join(''));
      }
    }
  });

  orders
    .fetch({
      data: {
        limit: 'all'
      , status: 'accepted'
      , start_date: moment().add('months', -2).format('YYYY-MM-DD')
      }
    })
    .then( function(){
      items.fetch();
    });

  return Object.create({
    init: function(){
      var tableView = this.tableView = new TableView({
        collection:   items
      , template:     Hbs.partials.payment_summary_table
      , rowTemplate:  Hbs.partials.payment_summary_table_row
      , dataListId:   dataListId
      });

      var ordersListView = this.ordersListView = new DataListView({
        collection: orders
      , template: Hbs.partials.orders_data_list
      , dataListId: dataListId
      });

      utils.domready( function(){
        tableView.setElement( utils.dom('#payment-summary-items-table') );
        tableView.render();

        ordersListView.setElement( utils.dom('#orders-data-list') );
        ordersListView.render();
      });

      utils.dom('#create-payment-summary-item-btn').click( function(){
        items.push( items.createModel() );
      });

      utils.dom('#delete-payment-summary-btn').click( function(){
        summary.destroy({ success: function(){
          goBack();
        }});
      });

      utils.dom('[data-role="order-fetch"]').click( function( e ){
        this.fetchOrders(
          utils.dom('[name="order_from"]').val()
        , utils.dom('[name="order_to"]').val()
        );
      }.bind( this ));

      utils.dom('#save-payment-summary-btn').click( function(){
        tableView.updateModels();

        async.series([
          function( done ){
            summary.save({
              payment_date:     utils.dom('[name="payment_date"]').val()
            , adjustment:       Hbs.helpers.pennies( utils.dom('[name="pms_adjustment"]').val() )
            , adjustment_text:  utils.dom('[name="adjustment_text"]').val()
            , items:            items.toArray()
            }, { success: function(){ done() }, error: done } );
          }
        ]
        , function( error ){
            if ( error ) return alert( error );
            goBack();
          }
        )
      });

      summary.on('change:payment_date', function( model, date ){
        utils.dom('[name="payment_date"]').val( utils.dateTimeFormatter( date ) );
      });

      summary.on('change:adjustment', function( model, adj ){
        utils.dom('[name="pms_adjustment"]').val( Hbs.helpers.dollars( adj ) );
      });

      summary.on('change:adjustment_text', function( model, adj ){
        utils.dom('[name="adjustment_text"]').val( adj );
      });

      // When order_id changes, set the order on that mofo
      items.on( 'change:order_id', function( model, id ){
        model.set( 'order', orders.get( id ) );
      });
    }

  , fetchOrders: function( from, to ){
      orders.filter( function( order ){
        var tz    = order.attributes.timezone;
        var date  = moment( order.get('datetime') ).tz( tz );

        return moment( from ).tz( tz ) <= date && date <= moment( to ).tz( tz );
      }).forEach( function( order ){
        // Funky way of adding each item, but this ensures our previous
        // way of propagating order changes on a record translates over nicely
        var item = items.createModel();
        items.add( item );
        item.set( 'order_id', order.get('id') );
      });
    }
  });
});