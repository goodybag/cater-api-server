var OrderView = FormView.extend({
  submitSelector: '.order-save-btn',

  events: function() {
    return {
      'keyup .order-form .form-control, .adjustment .form-control': 'autoSave',
      'change .order-form .form-control, .adjustment .form-control, .tip-area .form-control': 'autoSave',
      'submit .order-form': 'onSave',
      'click .edit-address-btn': 'editAddress',
      'click .btn-cancel': _.bind(this.changeStatus, this, 'canceled'),
      'click .btn-submit': 'submit',
      'click .btn-reject': _.bind(this.changeStatus, this, 'denied'),
      'click .btn-accept': _.bind(this.changeStatus, this, 'accepted'),
      'click #change-status-pending': _.bind(this.changeStatus, this, 'pending', false),
      'click #change-status-canceled': _.bind(this.changeStatus, this, 'canceled', false),
      'click #change-status-submitted': _.bind(this.changeStatus, this, 'submitted', false),
      'click #change-status-denied': _.bind(this.changeStatus, this, 'denied', false),
      'click #change-status-accepted': _.bind(this.changeStatus, this, 'accepted', false),
      'click #change-status-delivered': _.bind(this.changeStatus, this, 'delivered', false)
    }
  },

  initialize: function(options) {
    this.items = options.items || [];

    // please add any model listeners in the setModel function
    this.setModel((this.model) ? this.model : new Order());

    this.datepicker = this.$el.find(".order-form #order-date").eq(0).pickadate({
      format: 'mm/dd/yyyy'
    , min: new Date()
    }).pickadate('picker');

    this.timepicker = this.$el.find(".order-form #order-time").eq(0).pickatime({
      format: 'h:i A'
    , interval: 15
    }).pickatime('picker');

    this.on('save:success', this.onSaveSuccess, this);

    return this;
    // This is causing some width issues with this select
    // Let's go standard select until we can fix it
    // this.$el.find('#address-state').select2();
  },

  // set the model and add listeners here
  setModel: function(model) {
    if (this.model) this.stopListening(this.model);
    this.model = model;

    this.listenTo(this.model, {
      'change:sub_total': this.onPriceChange,
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
      this.updateAddressBlock();
    }
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
    for (var i = 0, selector, l = this.model.validationError.length; i < l; ++i){
      if ( typeof this.model.validationError[i] === 'string' ){
        selector = '[data-error="' + this.model.validationError[i] + '"]';
      } else if ( typeof this.model.validationError[i] === 'object' ){
        if ( !(this.model.validationError[i].property in fieldSelector) ) continue;
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

  onSubmittableChange: function(model, value, options) {
    this.$el.find('.btn-submit').toggleClass( 'hide', !value );
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
    tip: '.tip-area .tip'
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
      var percentage = parseFloat(this.$el.find(this.fieldMap.tip).val())
      return !_.isNaN(percentage) ? this.model.get('sub_total') * percentage : 0;
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
  }
});
