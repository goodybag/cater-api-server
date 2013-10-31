var ReceiptView = OrderView.extend({
  events: function() {
    return _.extend({}, OrderView.prototype.events, {
      'keyup .order-form .form-control, .adjustment .form-control, .tip-area .form-control': 'autoSave',
      'change .order-form .form-control, .adjustment .form-control, .tip-area .form-control': 'autoSave',
      'click .btn-reject': _.bind(this.changeStatus, this, 'denied'),
      'click .btn-accept': _.bind(this.changeStatus, this, 'accepted'),
      'click #change-status-pending': _.bind(this.changeStatus, this, 'pending', false),
      'click #change-status-canceled': _.bind(this.changeStatus, this, 'canceled', false),
      'click #change-status-submitted': _.bind(this.changeStatus, this, 'submitted', false),
      'click #change-status-denied': _.bind(this.changeStatus, this, 'denied', false),
      'click #change-status-accepted': _.bind(this.changeStatus, this, 'accepted', false),
      'click #change-status-delivered': _.bind(this.changeStatus, this, 'delivered', false),
      'click .copy-order-btn': 'makeCopy'
    });
  },

  initialize: function(options) {
    // please add any model listeners in the setModel function
    this.setModel((this.model) ? this.model : new Order());

    this.copyErrorModal = new CopyErrorModalView({el: '#copy-order-error-modal'});

    this.on('save:success', this.onSaveSuccess, this);

    return this;
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

    return this;
  },

  onPriceChange: function(model, value, options) {
    this.$el.find('.totals').html(Handlebars.partials.totals({order: this.model.toJSON()}));
  },

  onPhoneChange: function(model, value, options) {
    this.$el.find(this.fieldMap.phone).val(Handlebars.helpers.phoneNumber(value))
  },

  displayErrors: function() {
    FormView.prototype.displayErrors.apply(this, arguments);
    if ( !this.model.validationError ) return this;

    // Maps field names to error selectors
    var fieldSelector = {
      zip: '.alert-bad-zip'
    };

    // Show each alert corresponding to an error
    for (var i = 0, selector, l = this.model.validationError.length; i < l; ++i) {
      if ( typeof this.model.validationError[i] === 'string' ){
        selector = '[data-error="' + this.model.validationError[i] + '"]';
      } else if ( typeof this.model.validationError[i] === 'object' && this.model.validationError[i].property in fieldSelector) {
        selector = fieldSelector[ this.model.validationError[i].property ];
      } else continue;

      this.$el.find( selector ).removeClass('hide');
    }

    return this;
  },

  // Override onChange to noop because we do not want to hide the submit button
  onChange: function(){},

  clearErrors: function(){
    this.$el.find('.alert').addClass('hide');
    return this;
  },

  setAlerts: function(selector, model, value, options) {
    this.$el.find(selector).toggleClass('hide', !value);
  },

  changeStatus: function(status, checkNulls) {
    if (checkNulls == null) checkNulls = true;
    if (status === this.model.get('status')) return;
    if (checkNulls && status == 'submitted') {
      var vals = _.pick(this.model.toJSON(), this.model.requiredFields)
      this.$el.find('.order-form-field').parent().removeClass('has-error');
      var err = false;

      for (var key in vals) {
        if (vals[key] == null) {
          this.$el.find(this.fieldMap[key]).parent().addClass('has-error');
          err = true
        }
      }

      if (err) {
        this.$el.find('.order-address-form').removeClass('hide');
        this.$el.find('.order-address-block').addClass('hide');
        window.scrollTo(0);
        return;
      }
    }

    var url = this.model.url();
    if (this.options.review_token) url += '?review_token=' + this.options.review_token;
    $.ajax({
      url: this.model.url() + '/status-history',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({status: status, review_token: this.options.review_token}),
      error: function(jqXHR, textStatus, errorThrown) { alert(errorThrown); },
      success: function(data, textStatus, jqXHR) { window.location.href = url }
    });
  },

  fieldMap: {
    datetime: '.order-datetime',
    street: '#address-street',
    city: '#address-city',
    state: '#address-state',
    zip: '#address-zip',
    phone: '#order-phone',
    guests: '#order-guests',
    notes: '#order-notes',
    adjustment: '.adjustment .form-control',
    tip: '.tip-area .tip',
    name: '.order-name'
  },

  fieldGetters: {
    guests: _.partial(FormView.intGetter, 'guests'),

    datetime: function() {
      var date = this.$el.find(".order-form #order-date").val().trim();
      var time = this.$el.find(".order-form #order-time").val().trim();
      var datepart = date ? dateTimeFormatter(date) : null;
      var timepart = time ? timeFormatter(time, 'HH:mm:ss') : null;


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
      var $adj = this.$el.find('.adjustment');
      if (!$adj.hasClass('editable'))
        return this.model.get('adjustment');

      var desc = $adj.find('.adjustment-description').val().trim() || null
      var amount = parseInt($adj.find('.adjustment-amount').val().trim() * 100)
      return {
        description: desc,
        amount: !utils.isNaN(amount) ? amount : null
      };
    },

    tip: function() {
      var tip = parseFloat(this.$el.find(this.fieldMap.tip).val())
      return !_.isNaN(tip) ? Math.round(tip * 100) : 0;
    }
  },

  editAddress: function(e) {
    this.$el.find('.order-address').toggleClass('hide');
    this.updateAddressBlock();
  },

  updateAddressBlock: function() {
    var addr = {
      street: this.$el.find('.address-street').val(),
      city: this.$el.find('.address-city').val(),
      state: this.$el.find('.address-state').val(),
      zip: this.$el.find('.address-zip').val()
    }
    this.$el.find('.order-address-block').html(Handlebars.helpers.address(addr));
  },

  autoSave: _.debounce(FormView.prototype.onSave, 600),

  submit: function() {
    async.each(this.items.concat(this), function(view, cb) {
      view.onSave(null, cb);
    }, utils.bind(function(err) {
      if (!err)
        this.changeStatus('submitted');
    }, this));
  },

  onSaveSuccess: function() {
    this.clearErrors();
  },

  clickTipButton: function(e) {
    var percentage = $(e.currentTarget).attr('data-percent');
    var tip = (this.model.get('sub_total') * percentage / 100).toFixed(2);
    this.$el.find(this.fieldMap.tip).val(tip);
    this.autoSave();
  },

  makeCopy: function(e) {
    this.model.copy(function(err, newOrder) {
      if (err) {
        this.copyErrorModal.setModel(this.model);
        this.copyErrorModal.$el.modal('show');
      } else {
        var queryParams = {
          copy: true
        };

        if (newOrder.get('lostItems')) queryParams.lostItems = _.pluck(newOrder.get('lostItems'), 'name');
        window.location = _.result(newOrder, 'url') + utils.queryParams(queryParams);
      }
    });
  }
});
