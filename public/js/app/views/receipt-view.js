define(function(require, exports, module) {
  var $ = require('jquery');
  var utils = require('utils');
  var states = require('states');
  var moment = require('moment');
  var Handlebars = require('handlebars');
  var helpers = require('hb-helpers');

  var OrderView = require('./order-view');
  var FormView = require('./form-view');
  var TipView = require('./tip-view');
  var CopyErrorModalView = require('./copy-error-modal');
  var ItemModal = require('./item-modal');
  var AddTipModal = require('./add-tip-modal');

  var ReceiptView = OrderView.extend({
    events: function() {
      return _.extend({}, OrderView.prototype.events.call(this), {
        'click .btn-cancel': _.bind(_.debounce(this.changeStatus, 200), this, 'canceled', true),
        'click .copy-order-btn': 'copyOrder',
        'click .btn-reject': 'rejectOrder',
        'click .btn-accept': _.bind(_.debounce(this.changeStatus, 200), this, 'accepted', true),
        'click #change-status-pending': _.bind(this.changeStatus, this, 'pending', true),
        'click #change-status-canceled': _.bind(this.changeStatus, this, 'canceled', true),
        'click #change-status-submitted': _.bind(this.changeStatus, this, 'submitted', true),
        'click #change-status-denied': _.bind(this.changeStatus, this, 'denied', true),
        'click #change-status-accepted': _.bind(this.changeStatus, this, 'accepted', true),
        'click #change-status-delivered': _.bind(this.changeStatus, this, 'delivered', true),
        'click #change-status-submitted-no-notify': _.bind(this.changeStatus, this, 'submitted', false),
        'click #change-status-accepted-no-notify': _.bind(this.changeStatus, this, 'accepted', false),
        'click #change-status-canceled-no-notify': _.bind(this.changeStatus, this, 'canceled', false),
        'click .edit-order-btn': 'toggleEdit',
        'click .cancel-edit-btn': 'toggleEdit',
        'click .save-btn': 'save',
        'click .btn-add-tip': 'showTipModal'
      });
    },

    step: 3,

    initialize: function() {
      OrderView.prototype.initialize.apply(this, arguments);
      this.tipView = new TipView({el: '.tip-area', model: this.model, orderView: this});
      this.originalTipValue = this.$el.find('.order-tip').val();
      this.originalTipPercent = this.$el.find('.tip-percent').val();

      this.copyErrorModal = new CopyErrorModalView({el: '#copy-order-error-modal'});
      this.convertUtcDates();

      this.itemModal = new ItemModal({
        el:         '#item-modal'
      , orderItems: this.model.orderItems
      , orderModel: this.model
      });

      this.addTipModal = new AddTipModal({el: '#add-tip-modal', model: this.model, orderView: this});

      // Since this view isn't able to just reasily re-render itself
      // when the underlying models change, just reload the page
      this.itemModal.on('submit:success', function(){
        window.location.reload();
      });

      this.onPriceChange();

      this.initTxFeePopover( this.model.restaurant.toJSON() );

    },

    initDatepicker: function() {
      this.datepicker = this.$el.find('.form-group-delivery-date > .order-datetime').pickadate({
        format: 'mm/dd/yyyy'
      }).pickadate('picker');

      this.timepicker = this.$el.find('.form-group-delivery-time > .order-datetime').pickatime({
        format: 'hh:i A'
      , interval: 15
      }).pickatime('picker');
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

    }, OrderView.prototype.fieldMap),

    fieldGetters: _.extend({

    }, OrderView.prototype.fieldGetters),

    rejectOrder: function() {
      var self = this;

      this.$el.find('#reject-confirm-modal .has-error').removeClass('has-error');

      var $reasonDenied = this.$el.find('.reason-denied');
      var reasonDenied = $reasonDenied.val().trim();
      if ( !reasonDenied.length ) {
        return $reasonDenied.closest('.form-group').addClass('has-error');
      }

      this.model.save({ reason_denied: reasonDenied, review_token: this.options.review_token }, {
        validate: false,
        patch: true,
        success: function () {
          self.changeStatus('denied');
        },
        error: function(model, res, options) {
          if(console && console.error) console.error('Could not save reason for rejection', arguments);
        }
      });
    },

    showTipModal: function(e) {
      e.preventDefault();
      this.addTipModal.$el.modal('show');
    },

    resetTip: function(e) {
      this.$el.find('.order-tip').val(this.originalTipValue);
      this.$el.find('.tip-percent').val(this.originalTipPercent);
      this.onPriceChange();
    },

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
      this.$el.find('.totals').html(Handlebars.partials['totals']({order: updatedOrder, step: this.step}));
    },

    onPhoneChange: function(model, value, options) {
      this.$el.find(this.fieldMap.phone).val(Handlebars.helpers['phoneNumber'](value))
    },

    changeStatus: function(status, notify) {
      this.model.changeStatus(status, notify, this.options.review_token, function(err) {
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
              address:  utils.extend( order.address.toJSON(), {
                          name: context.order.address_name
                        }),
              states: states
            };
          }
        };

        // {{#with}} HBS helper not working with context functions
        context.orderAddress = context.orderAddress();

        console.log('rendering with', context);
        this.$el.find('.delivery-info').html(Handlebars.partials.order_info(context));
        this.initDatepicker();
      }
    },

    save: function() {
      var self = this;
      this.onSave(function(err, data) {
        self.toggleEdit();
      });
    }
  });

  utils.extend( ReceiptView.prototype, require('app/views/mixins/tx-fee-popover')() );

  return module.exports = ReceiptView;
});
