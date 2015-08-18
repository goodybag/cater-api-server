define(function(require, exports, module) {
  var utils = require('utils');
  var moment = require('moment');
  var Handlebars = require('handlebars');

  var Order = require('../models/order');

  var FormView = require('./form-view');
  var OrderAddressView = require('./order-address-view');
  var CopyErrorModalView = require('./copy-error-modal');
  var AmenityView = require('app/views/order/amenity-view');
  var Amenity = require('app/models/amenity');
  var TipView = require('./tip-view');
  var helpers = require('hb-helpers');


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

        'keyup .adjustment': 'autoSave',
        'keyup .order-tip': 'autoSave',
        'change .order-tip': 'autoSave',
        'change .tip-percent': 'autoSave'
      });
    },

    step: 1,

    fieldMap: {
      datetime: '.order-datetime',
      guests: '#order-guests',
      name: '.order-name',
      notes: '#order-notes',
      tip: '.order-tip',
      tip_percent: '.tip-percent',
      quantity: '.order-item-quantity',
      adjustment_description: '[name="adjustment_description"]',
      adjustment_amount: '[name="adjustment_amount"]',
      user_adjustment_description: '[name="user_adjustment_description"]',
      user_adjustment_amount: '[name="user_adjustment_amount"]'
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

      adjustment_amount: function() {
        return helpers.pennies(
          this.$el.find(this.fieldMap.adjustment_amount).val()
        );
      },

      user_adjustment_amount: function(){
        return helpers.pennies(
          this.$el.find( this.fieldMap.user_adjustment_amount ).val()
        );
      }
    },

    getDiff: function() {
      var diff = FormView.prototype.getDiff.apply(this, arguments);
      var addrDiff = this.addressView.getDiff.apply(this.addressView, arguments);

      // Do not overwrite order name
      if ( addrDiff && addrDiff.name ){
        addrDiff.address_name = addrDiff.name;
        delete addrDiff.name;
      }

      return diff || addrDiff ? _.extend({}, diff, addrDiff) : null;
    },

    initialize: function(options) {
      var this_ = this;

      // Attach amenity views
      this.amenitiesViews = this.model.restaurant.attributes.amenities.map(function(amenity) {
        var selector = '[data-amenity-id="' + amenity.id + '"]';
        var model = new Amenity(utils.extend({ quantity: this.model.get('guests') }, amenity));

        this_.listenTo(model, 'change:quantity', this_.updateAmenity);
        this_.listenTo(model, 'change:checked', this_.toggleAmenity);

        this_.listenTo(model, 'change:quantity', this_.updateAmenitiesTotal);
        this_.listenTo(model, 'change:checked', this_.updateAmenitiesTotal);

        return new AmenityView({
          el: selector
        , model: model
        , order: this.model
        , orderView: this
        });
      }.bind(this));

      // this.amenitiesView = new AmenitiesView({el: '.amenities', order: this.model, orderView: this});
      this.addressView = new OrderAddressView({el: '.delivery-info', model: this.model.address, orderView: this, user: this.options.user});
      this.tipView = new TipView({el: '.tip-area', model: this.model, orderView: this});
      this.copyErrorModal = new CopyErrorModalView({el: '#copy-order-error-modal'});

      this.subViews = [this.addressView];

      // please add any model listeners in the setModel function
      this.setModel((this.model) ? this.model : new Order());
    },

    updateAmenitiesTotal: function(amenity) {
      var total = this.amenitiesViews.reduce(function(total, view) {
        return total += view.model.get('checked') ? view.model.getTotalPrice() : 0;
      }, 0);
      this.model.set('amenities_total', total);
    },

    updateAmenity: function(amenity) {
      this.$el
        .find('.order-summary [data-amenity-id="' + amenity.id + '"] .item-price')
        .text(Handlebars.helpers.surcharge(amenity.getTotalPrice()));

      if (amenity.get('scale') !== 'flat' )
        this.$el
          .find('.order-summary [data-amenity-id="' + amenity.id + '"] .item-quantity')
          .text('x ' + amenity.get('quantity'));
    },

    toggleAmenity: function(amenity) {
      var $el = this.$el.find('.order-summary [data-amenity-id="' + amenity.id + '"]');
      $el.toggleClass('hide');
    },

    updateGuests: function(e) {
      var $el = $(e.target);
      this.model.set('guests', $el.val());
    },

    // set the model and add listeners here
    setModel: function(model) {
      if (this.model) this.stopListening(this.model);
      this.model = model;

      this.listenTo(this.model, {
        'change:total': this.onPriceChange,
        'change:phone': this.onPhoneChange,
        'change:invalid_address': function () { alert('Invalid Address') }
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
      this.$el.find('.totals').html(Handlebars.partials.totals({order: updatedOrder, step: this.step }));
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

      // Recompile error template
      var this_ = this;
      var context = { order: this_.model.toJSON() };

      this.model.validationError.forEach(function(err) {
        var markup = Handlebars.partials['alert_' + err](context);
        var selector = '.alert[data-error="' + err + '"]';
        this_.$el.find(selector).html(markup);
      });

      // Unhide these errors
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
