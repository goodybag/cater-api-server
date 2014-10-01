define(function(require){
  var Hbs       = require('handlebars');
  var utils     = require('utils');
  var Summaries = require('app/collections/payment-summaries');
  var TableView = require('views/table-view');

  return Object.create({
    init: function( options ){
      this.options = options = options || {};

      var summaries = this.summaries = new Summaries( null, {
        restaurant_id: options.restaurant.id
      });

      summaries.fetch({ data: { limit: 'all' } });

      var tableView = this.tableView = new TableView({
        collection:   summaries
      , template:     Hbs.partials.payment_summaries_table
      , rowTemplate:  Hbs.partials.payment_summaries_table_row
      , restaurant:   options.restaurant
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