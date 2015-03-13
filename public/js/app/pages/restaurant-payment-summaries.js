define(function(require){
  var Hbs       = require('handlebars');
  var utils     = require('utils');
  var spinner   = require('spinner');
  var Summaries = require('app/collections/payment-summaries');
  var TableView = require('views/table-view');
  var RowView   = require('views/table-row-view');

  RowView = RowView.extend({
    events: utils.extend({
      'click [data-role="pms-send"]': 'onPmsSendClick'
    , 'click [data-role="pms-credit"]': 'onPmsCreditClick'
    }, RowView.prototype.events )

  , onPmsSendClick: function( e ){
      var id = utils.dom( e.currentTarget ).data('id');
      page.sendPms( id );
    }

  , onPmsCreditClick: function( e ){
      var id = utils.dom( e.currentTarget ).data('id');
      page.creditPms( id );
    }
  });

  var page = Object.create({
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
      , RowView:      RowView
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

  , getRecipients: function(){
      var val = utils.dom('[name="recipient"]').val();
      if ( !val ) return [];
      return val.split(',');
    }

  , sendPms: function( id ){
      var recipients = this.getRecipients();

      if ( recipients.length === 0 ) return;

      var $btn    = utils.dom('tr[data-id="' + id + '"] [data-role="pms-send"]');
      var oldText = $btn.text();

      spinner.start();

      utils.ajax({
        type:     'POST'
      , url:      [ '/api/restaurants'
                  , this.options.restaurant.id
                  , 'payment-summaries'
                  , id
                  , 'send'
                  ].join('/')
      , json:     true
      , headers:  { 'Content-Type': 'application/json' }
      , data:     JSON.stringify({ recipients: recipients })
      })
      .always( function(){
        spinner.stop();
        setTimeout( $btn.text.bind( $btn, oldText ), 3000 );
      })
      .fail( function( xhr, status, error ){
        $btn.text('Error!');
      })
      .done( function( data, status, xhr ){
        $btn.text('Success!');
      });
    }
  , creditPms: function( id ){
      spinner.start();
      // ajax post
    }
  });

  return page;
});
