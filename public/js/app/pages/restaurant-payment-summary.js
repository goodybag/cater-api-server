define(function(require){
  var Hbs       = require('handlebars');
  var async     = require('async');
  var utils     = require('utils');
  var summary   = require('data/payment-summary');
  var items     = require('data/payment-summary-items');
  var TableView = require('views/table-view');

  var goBack = function(){
    var href = window.location.href;
    window.location.href = href.substring( 0, href.lastIndexOf('/') );
  };

  summary.fetch();
  items.fetch();

  return Object.create({
    init: function(){
      var tableView = this.tableView = new TableView({
        collection: items
      , template: Hbs.partials.payment_summary_table
      });

      utils.domready( function(){
        tableView.setElement( utils.dom('#payment-summary-items-table') );
        tableView.render();
      });

      utils.dom('#create-payment-summary-item-btn').click( function(){
        items.unshift( items.createModel() );
      });

      utils.dom('#delete-payment-summary-btn').click( function(){
        summary.destroy({ success: function(){
          goBack();
        }});
      });

      utils.dom('#save-payment-summary-btn').click( function(){
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
    }
  });
});