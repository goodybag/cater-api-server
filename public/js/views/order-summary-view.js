var OrderSummaryView = Backbone.View.extend({
  events: {
    'click .btn-checkout': 'checkout'
  },

  template: Handlebars.partials.menu_order_summary,

  initialize: function(options) {
    if (this.model) this.setModel(this.model);
    this.setMaxHeight();
    $(window).resize(utils.bind(this.setMaxHeight, this));
  },

  setMaxHeight: function() {
    this.$el.css('max-height', window.innerHeight - 60);
  },

  setModel: function(model) {
    if(this.model) this.stopListening(this.model);
    this.model = model;
    this.model.on('change', this.render, this);
  },

  render: function(){
    var this_ = this;

    this.$el.html( this.template({ order: this.model.toJSON() }) );
    this.$tbody = this.$el.find('.order-table tbody');

    this.delegateEvents();

    // Instantiate child views
    this.$el.find('tr').each( function(){
      var $el = $(this);
      new OrderItemSummaryView({
        model: this_.model.orderItems.get( $el.data('id') )
      , orderParams: orderParams
      , itemModalView: itemModalView
      , orderModel: this_.model
      , el: $el[0]
      });
    });
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
    var obj = this.options.orderParams.toJSON();
    var params = {
      zip: obj.zip || undefined,
      guests: obj.guests || undefined,
      datetime: _.compact([obj.date, obj.time]).join(' ') || undefined,
      state: 'TX'
    };

    var diff = _.defaults(this.model.pick(_.keys(params)), params);
    // var diff = {};
    // for (var key in params)
    //   diff[key] = this.model.has(key) ? this.model.get(key) : params[key];

    var view = this;
    var sent = this.model.save(diff, {
      patch: true,
      wait: true,
      singleError: false,
      success: function(model, response, options) {
        // Reset order params
        _.each( _.keys( orderParams.toJSON() ), _.bind( orderParams.unset, orderParams ) );

        orderParams.save( null, { success: function(){
          window.location.href = _.result(view.model, 'url') + '/items';
        } })
      }
    });
  }
});
