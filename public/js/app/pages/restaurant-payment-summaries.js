define(function(require){
  var Hbs       = require('handlebars');
  var utils     = require('utils');
  var summaries = require('data/payment-summaries');
  var TableView = require('views/table-view');

  summaries.fetch({ data: { limit: 'all' } });

  return Object.create({
    init: function(){
      var tableView = this.tableView = new TableView({
        collection:   summaries
      , template:     Hbs.partials.payment_summaries_table
      , rowTemplate:  Hbs.partials.payment_summaries_table_row
      });

      utils.domready( function(){
        tableView.setElement( utils.dom('#payment-summaries-table') );
        tableView.render();
      });

      utils.dom('#create-payment-summary-btn').click( function(){
        summaries.create().once( 'change:id', function( summary, id ){
          window.location.href += '/' + id;
        });
      });
    }
  });
});