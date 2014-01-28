define(function(require){
  var Hbs           = require('handlebars');
  var async         = require('async');
  var utils         = require('utils');
  var summary       = require('data/payment-summary');
  var items         = require('data/payment-summary-items');
  var orders        = require('data/orders');
  var TableView     = require('views/table-view');
  var DataListView  = require('views/data-list-view');

  var goBack = function(){
    var href = window.location.href;
    window.location.href = href.substring( 0, href.lastIndexOf('/') );
  };

  var dataListId = 'orders-datalist'

  summary.fetch();
  items.fetch();
  orders.fetch();

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

      utils.dom('#save-payment-summary-btn').click( function(){
        tableView.updateModels();

        async.parallel(
          items.toArray().map( function( model ){
            return function( done ){
              model.save( null, { success: function(){ done(); }, error: done } );
            };
          }).concat( function( done ){
            summary.save({
              payment_date: utils.dom('[name="payment_date"]').val()
            }, { success: function(){ done() }, error: done } );
          })
        , function( error ){
            if ( error ) return alert( error );
            goBack();
          }
        )
      });

      summary.on('change:payment_date', function( model, date ){
        utils.dom('[name="payment_date"]').val( utils.dateTimeFormatter( date ) );
      });

      // When order_id changes, set the order on that mofo
      items.on( 'change:order_id', function( model, id ){
        model.set( 'order', orders.get( id ) );
      });
    }
  });
});