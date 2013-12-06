define(function(require, exports, module) {
  var OrderView = require('./order-view');

  module.exports = OrderView.extend({
    events: function() {
      return _.extend({}, OrderView.prototype.events, {
        'click .btn-cancel': _.bind(this.changeStatus, this, 'canceled'),
        'click .copy-order-btn': 'copyOrder',
        'click .btn-reject': _.bind(this.changeStatus, this, 'denied'),
        'click .btn-accept': _.bind(this.changeStatus, this, 'accepted'),
        'click #change-status-pending': _.bind(this.changeStatus, this, 'pending'),
        'click #change-status-canceled': _.bind(this.changeStatus, this, 'canceled'),
        'click #change-status-submitted': _.bind(this.changeStatus, this, 'submitted'),
        'click #change-status-denied': _.bind(this.changeStatus, this, 'denied'),
        'click #change-status-accepted': _.bind(this.changeStatus, this, 'accepted'),
        'click #change-status-delivered': _.bind(this.changeStatus, this, 'delivered'),
        'click .edit-order-btn': 'toggleEdit',
        'click .cancel-edit-btn': 'toggleEdit',
        'click .save-btn': 'save'
      });
    },

    initialize: function() {
      OrderView.prototype.initialize.apply(this, arguments);
      this.tipView = new TipView({el: '.tip-area', model: this.model, orderView: this});
      this.copyErrorModal = new CopyErrorModalView({el: '#copy-order-error-modal'});
      this.convertUtcDates();
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

    /**
     * Convert backend dates stored in UTC
     * to client's local timezone
     */
    convertUtcDates: function() {
      var $submitted = this.$el.find('.date-submitted');
      var output = $submitted.data('date') ?
        'Date submitted: ' + moment.utc($submitted.data('date')).local().format('l h:mm A')
      : '';
      $submitted.html(output);
    },

    onPriceChange: function(model, value, options) {
      var updatedOrder = _.extend(this.model.toJSON(), this.getDiff());
      this.$el.find('.totals').html(Handlebars.partials.totals({order: updatedOrder}));
    },

    onPhoneChange: function(model, value, options) {
      this.$el.find(this.fieldMap.phone).val(Handlebars.helpers.phoneNumber(value))
    },

    changeStatus: function(status) {
      this.model.changeStatus(status, this.options.review_token, function(err) {
        if (err) return alert(err);
        window.location.reload();
      });
    },

    copyOrder: function(e) {
      this.model.copy(function(err, newOrder) {
        if (err) {
          this.copyErrorModal.setModel(order);
          copyErrorModal.$el.modal('show');
        } else {
          var queryParams = { copy: true };
        }

        if (newOrder.get('lostItems'))
          queryParams.lostItems = _.pluck(newOrder.get('lostItems'), 'name');

          window.location = _.result(newOrder, 'url') + utils.queryParams(queryParams);
      });
    },

    autoSave: _.debounce(FormView.prototype.onSave, 600),

    toggleEdit: function() {
      if (this.model.get('editable')) {
        this.edit = !this.edit;
        var order = this.model;
        var context = {
          order: this.model.toJSON(),
          edit: this.edit,
          orderAddress: function() {
            return {
              address: order.toJSON(),
              states: states
            };
          }
        };
        this.$el.find('.delivery-info').html(Handlebars.partials.order_info(context));
        this.$el.find('.tip-area').toggleClass('hide');
      }
    },

    save: function() {
      var self = this;
      this.onSave(function(err, data) {
        self.toggleEdit();
      });
    }
  });
});