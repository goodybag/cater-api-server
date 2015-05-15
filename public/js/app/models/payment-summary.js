define(function(require, exports, module) {
  var utils     = require('utils');
  var Orders    = require('app/collections/restaurant-orders');
  var PMSItems  = require('app/collections/payment-summary-items');

  return module.exports = utils.Model.extend({
    url: function(){
      var url = [
        '/api/restaurants'
      , this.get('restaurant_id')
      , 'payment-summaries'
      ];

      if ( this.get('id') && this.get('id') !== 'new' ){
        url.push( this.get('id') );
      }

      return url.join('/');
    }

  , initialize: function( attr, options ){
      if ( attr && attr.items ){
        this.setItems( attr.items );
        delete attr.items;
      }

      this.sales_tax = options.sales_tax;
    }

  , setItems: function( items ){
      if ( !(items instanceof PMSItems) ){
        this.items = new PMSItems( items, {
          restaurant_id:  this.get('restaurant_id')
        , sales_tax:      this.sales_tax
        , plan:           this.get('plan')
        });

        this.items.invoke('updatePropertiesBasedOnOrder');
      } else {
        this.items = items;
      }

      return this;
    }

  , toJSON: function(){
      var json = utils.Model.prototype.toJSON.call( this );

      if ( this.items ){
        json.items = this.items.toJSON();
      }

      return json;
    }

  , generate: function( d1, d2, callback ){
      [ d1, d2 ].forEach( function( d ){
        if ( typeof d !== 'string' ){
          throw new Error('Invalid type for date. Expected string');
        }

        if ( !/\d{4}\-\d{2}\-\d{2}/.test( d ) ){
          throw new Error('Invalid format for date parameter. Expected `yyyy-mm-dd`');
        }
      });

      var orders = new Orders( null, { restaurant_id: this.get('restaurant_id') } );

      orders.fetch({ error: callback, data: {
        start_date: d1
      , end_date:   d2
      , limit:      'all'
      , status:     'accepted'
      }}).then( function(){
        var items = orders.map( function( order ){
          return { order: order };
        });

        this.setItems( items );

        if ( callback ) callback();
      }.bind( this ));
    }
  });
});