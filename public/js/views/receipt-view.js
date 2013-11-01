var ReceiptView = OrderView.extend({
  events: function() {
    return _.extend({}, OrderView.prototype.events, {
      'keyup .order-form .form-control, .adjustment .form-control, .tip-area .form-control': 'autoSave',
      'change .order-form .form-control, .adjustment .form-control, .tip-area .form-control': 'autoSave',
      'click .btn-reject': _.bind(this.changeStatus, this, 'denied'),
      'click .btn-accept': _.bind(this.changeStatus, this, 'accepted'),
      'click #change-status-pending': _.bind(this.changeStatus, this, 'pending'),
      'click #change-status-canceled': _.bind(this.changeStatus, this, 'canceled'),
      'click #change-status-submitted': _.bind(this.changeStatus, this, 'submitted'),
      'click #change-status-denied': _.bind(this.changeStatus, this, 'denied'),
      'click #change-status-accepted': _.bind(this.changeStatus, this, 'accepted'),
      'click #change-status-delivered': _.bind(this.changeStatus, this, 'delivered')
    });
  },

  // set the model and add listeners here
  setModel: function(model) {
    OrderView.prototype.setModel.apply(this, arguments);

    this.listenTo(this.model, {
      'change:sub_total change:tip': this.onPriceChange,
      'change:phone': this.onPhoneChange
    }, this);

    this.listenTo(this.model.restaurant, {
      'change:is_bad_zip': utils.partial(this.setAlerts, '.alert-bad-zip'),
      'change:is_bad_delivery_time': utils.partial(this.setAlerts, '.alert-bad-delivery-time'),
      'change:is_bad_guests': utils.partial(this.setAlerts, '.alert-bad-guests'),
      'change:is_bad_lead_time': utils.partial(this.setAlerts, '.alert-bad-lead-time')
    }, this);

    return this;
  },

  fieldMap: _.extend({
    adjustment: '.adjustment .form-control'
  }, OrderView.prototype.fieldMap),

  fieldGetters: _.extend({}, OrderView.prototype.fieldGetters, {
    adjustment: function() {
      var $adj = this.$el.find('.adjustment');
      if (!$adj.hasClass('editable'))
        return this.model.get('adjustment');

      var desc = $adj.find('.adjustment-description').val().trim() || null
      var amount = parseInt($adj.find('.adjustment-amount').val().trim() * 100)
      return {
        description: desc,
        amount: !utils.isNaN(amount) ? amount : null
      };
    }
  }),

  onPriceChange: function(model, value, options) {
    this.$el.find('.totals').html(Handlebars.partials.totals({order: this.model.toJSON()}));
  },

  onPhoneChange: function(model, value, options) {
    this.$el.find(this.fieldMap.phone).val(Handlebars.helpers.phoneNumber(value))
  },

  changeStatus: function(status) {
    this.model.changeStatus(status, function(err) {
      if (err) return alert(err);
      window.location.reload();
    });
  },

  autoSave: _.debounce(FormView.prototype.onSave, 600)
});
