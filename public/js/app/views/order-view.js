define(function(require, exports, module) {
  var utils = require('utils');
  var moment = require('moment');
  var Handlebars = require('handlebars');

  var Order = require('../models/order');

  var FormView = require('./form-view');
  var OrderAddressView = require('./order-address-view');
  var CopyErrorModalView = require('./copy-error-modal');
  var TipView = require('./tip-view');


  var OrderView = FormView.extend({

    events: function() {
      return _.extend({}, OrderView.prototype.events, {
        'click .btn-cancel': 'cancel',
        'click .copy-order-btn': 'makeCopy',
        'click #change-status-pending': _.bind(this.changeStatus, this, 'pending', true),
        'click #change-status-canceled': _.bind(this.changeStatus, this, 'canceled', true),
        'click #change-status-submitted': _.bind(this.changeStatus, this, 'submitted', true),
        'click #change-status-denied': _.bind(this.changeStatus, this, 'denied', true),
        'click #change-status-accepted': _.bind(this.changeStatus, this, 'accepted', true),
        'click #change-status-delivered': _.bind(this.changeStatus, this, 'delivered', true),

        'click #change-status-submitted-no-notify': _.bind(this.changeStatus, this, 'submitted', false),
        'click #change-status-accepted-no-notify': _.bind(this.changeStatus, this, 'accepted', false),
        'click #change-status-canceled-no-notify': _.bind(this.changeStatus, this, 'canceled', false),

        'keyup .adjustment': 'autoSave'
      });
    },

    fieldMap: {
      datetime: '.order-datetime',
      guests: '#order-guests',
      name: '.order-name',
      notes: '#order-notes',
      tip: '.order-tip',
      tip_percent: '.tip-percent',
      quantity: '.order-item-quantity',
      adjustment: '.adjustment .form-control'
    },

    fieldGetters: {
      guests: _.partial(FormView.intGetter, 'guests'),

      tip: _.partial(FormView.dollarsGetter, 'tip'),

      datetime: function() {
        var date = this.$el.find("#order-form #order-date").val().trim();
        var time = this.$el.find("#order-form #order-time").val().trim();
        var datepart = date ? utils.dateTimeFormatter(date) : null;
        var timepart = time ? utils.timeFormatter(time, 'HH:mm:ss') : null;


        if(!datepart || !timepart) return null;

        // since we cannot determine offset, cannot format as ISO 8601 String
        // using "YYYY-MM-DD HH:mm:ss" to represent the date and time
        var datetime = datepart + ' ' + timepart;
        var date = moment(datetime);
        return date.isValid() ? datetime : null;
      },

      phone: function() {
        return this.$el.find(this.fieldMap.phone).val().replace(/[^\d]/g, '') || null;
      },

      adjustment: function() {
        console.log('adjustment getter');
        var $adj = this.$el.find('.adjustment');
        if (!$adj.hasClass('editable'))
          return this.model.get('adjustment');

        var desc = $adj.find('.adjustment-description').val().trim() || null
        var amount = Math.round($adj.find('.adjustment-amount').val().trim() * 100)
        return {
          description: desc,
          amount: !utils.isNaN(amount) ? amount : null
        };
      }
    },

    getDiff: function() {
      var diff = FormView.prototype.getDiff.apply(this, arguments);
      var addrDiff = this.addressView.getDiff.apply(this.addressView, arguments);
      return diff || addrDiff ? _.extend({}, diff, addrDiff) : null;
    },

    initialize: function(options) {
      console.log('order-view');
      this.addressView = new OrderAddressView({el: '.delivery-info', model: this.model.address, orderView: this, user: this.options.user});
      this.tipView = new TipView({el: '.tip-area', model: this.model, orderView: this});
      this.copyErrorModal = new CopyErrorModalView({el: '#copy-order-error-modal'});

      this.subViews = [this.addressView];

      // please add any model listeners in the setModel function
      this.setModel((this.model) ? this.model : new Order());
    },

    // set the model and add listeners here
    setModel: function(model) {
      if (this.model) this.stopListening(this.model);
      this.model = model;

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

      this.model.on('change:submittable', this.onSubmittableChange, this);

      if (this.model.get('editable')) {
        this.onChange();
      }
      return this;
    },

    onPriceChange: function(model, value, options) {
      var updatedOrder = _.extend(this.model.toJSON(), this.getDiff());
      this.$el.find('.totals').html(Handlebars.partials.totals({order: updatedOrder}));
    },

    setItems: function(items) {
      // Replace sub order-item-views and listen to remove
      // events.
      var self = this;
      _.each(this.items,
        _.compose(
          _.bind(this.stopListening, this),
          _.identity
        )
      );

      this.items = items;

      // Listen to each order item view for events
      _.each(this.items, function(item) {
        self.listenTo(item, {
          'remove': _.bind(self.removeOrderItem, self, item)
        , 'disableCheckout': _.bind(self.onSubmittableChange, self, null, false)
        , 'enableCheckout': _.bind(self.onSubmittableChange, self, null, true)
        });
      });
    },

    removeOrderItem: function(orderItemView) {
      // Stop listening and update items
      this.stopListening(orderItemView);
      this.items = _.without(this.items, orderItemView);

      //Display alert when list is empty
      if (!this.items.length)
        this.$el.find('.order-empty-alert').removeClass('hide');
    },

    cancel: function() {
      this.model.changeStatus('canceled', true, function(err, data) {
        if (err) return alert(err); // TODO: error handling
        window.location.reload();
      });
    },

    setAlerts: function(selector, model, value, options) {
      this.$el.find(selector).toggleClass('hide', !value);
    },

    makeCopy: function() {
      var self = this;
      this.model.copy(function(err, newOrder) {
        if (err) {
          self.copyErrorModal.setModel(self.model);
          self.copyErrorModal.$el.modal('show');
        } else {
          var queryParams = {
            copy: true
          };

          if (newOrder.get('lostItems')) queryParams.lostItems = _.pluck(newOrder.get('lostItems'), 'name');
          window.location = _.result(newOrder, 'url') + utils.queryParams(queryParams);
        }
      });
    },

    // Override onChange to noop because we do not want to hide the submit button
    onChange: function(){},

    onSubmittableChange: function(model, value, options) {
      this.$el.find('.btn-submit').toggleClass( 'disabled', !value );
    },

    displayErrors: function() {
      FormView.prototype.displayErrors.apply(this, arguments);

      var selector = _.map(_.filter(this.model.validationError, _.isString), function(err) {
        return '.alert[data-error="' + err + '"]';
      }).join(', ');

      if (selector) this.$el.find( selector ).removeClass('hide');

      return this;
    },

    clearErrors: function(){
      FormView.prototype.clearErrors.apply(this, arguments);

      this.$el.find('.alert').addClass('hide');
      return this;
    },

    changeStatus: function(status, notify) {
      this.model.changeStatus(status, notify, function(err) {
        if (err) return alert(err);
        window.location.reload();
      });
    },

    autoSave: _.debounce(FormView.prototype.onSave, 600)
  });

  return module.exports = OrderView;
});
