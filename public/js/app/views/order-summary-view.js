define(function(require, exports, module) {
  var $ = require('jquery');
  var Handlebars = require('handlebars');
  var utils = require('utils');
  var config = require('config');

  var Backbone = require('backbone');
  var OrderItemSummaryView = require('./order-item-summary-view');

  var OrderSummaryView = module.exports = Backbone.View.extend({
    events: {
      'click .btn-checkout': 'checkout'
    },

    template: Handlebars.partials.menu_order_summary,

    initialize: function(options) {
      if (this.model) this.setModel(this.model);
      var this_ = this;
      setInterval(function() {
        if ( this_.model.id ) this_.model.orderItems.fetch();
      }, config.menuRefresh);
    },

    setModel: function(model) {
      if(this.model) this.stopListening(this.model);
      this.model = model;
      this.model.on('change', this.render, this);
    },

    render: function(){
      var this_ = this;

      var html = this.template({
        order: this.model.toJSON()
      , disableCheckout: this.model.validateOrderFulfillability().length > 0
      , edit_token: this.options.editToken
      , config: config
      });
      this.$el.html( html );
      this.$tbody = this.$el.find('.order-table tbody');

      this.delegateEvents();

      // Instantiate child views
      this.model.orderItems.each( function(item) {
        var $el = this_.$el.find('tr[data-id="'+ item.id  +'"]');
        new OrderItemSummaryView({
          model: item
        , orderParams: this_.options.orderParams
        , itemModalView: this_.options.itemModalView
        , orderModel: this_.model
        , el: $el[0]
        });
      });

      this.initTxFeePopover( this.model.restaurant.toJSON() );

      return this;
    },

    addItem: function(model, collection, options) {
      this.toggleWithItems();

      var subview = new OrderItemSummaryView({
        model:          model
      , itemModalView:  this.options.itemModalView
      });

      this.$tbody.append(subview.render().el);
    },

    toggleWithItems: function() {
      var items = this.model.orderItems.length > 0;
      this.$el.find('.with-items').toggleClass('hide', !items);
      this.$el.find('.without-items').toggleClass('hide', items);
    },

    subTotalChange: function(model, value, options) {
      this.$el.find('.subtotal').text((value / 100).toFixed(2));
    },

    belowMinChange: function(model, value, options) {
      this.$el.find('.minimum-order').toggleClass('hide', !value);
    },

    submittableChange: function(model, value, options) {
      var $btn = this.$el.find('.btn-checkout');
      value ? $btn.removeAttr('disabled') : $btn.attr('disabled', 'disabled');
    },

    checkout: function(e) {
      var this_ = this;
      var obj = this.options.orderParams.toJSON();
      var params = {
        zip: obj.zip || undefined,
        guests: obj.guests || undefined,
        datetime: _.compact([obj.date, obj.time]).join(' ') || undefined,
        state: 'TX'
      };

      var currentState = _.extend(this.model.pick(['guests', 'datetime']), this.model.address.pick(['zip', 'state']));
      var diff = _.defaults(currentState, params);
      // var diff = {};
      // for (var key in params)
      //   diff[key] = this.model.has(key) ? this.model.get(key) : params[key];

      var view = this;

      // Always update the type first
      diff.type = this.model.get('type');

      var sent = this.model.save(diff, {
        patch: true,
        wait: true,
        singleError: false,
        success: function(model, response, options) {
          // Reset order params
          _.each( _.keys( this_.options.orderParams.toJSON() ), _.bind( this_.options.orderParams.unset, this_.options.orderParams ) );

          this_.options.orderParams.save( null, { success: function(){
            window.location.href = _.result(view.model, 'url') + '/items';
          } })
        }
      });

      if (!sent)
      if (this.model.validationError){
        this.trigger('invalid-order');
      }
    }
  });

  utils.extend( OrderSummaryView.prototype, require('app/views/mixins/tx-fee-popover')() );

  return OrderSummaryView;
});
