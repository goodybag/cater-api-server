var OrderView = Backbone.View.extend({
  model: Order,

  events: function() {
    return {
      'keyup .order-form .order-form-field': 'onOrderChange',
      'change .order-form .order-form-field': 'onOrderChange',
      'submit .order-form': 'onSave',
      'click .edit-address-btn': 'editAddress',
      'click .cancel-btn': _.bind(this.changeStatus, this, 'canceled'),
      'click .submit-btn': _.bind(this.changeStatus, this, 'submitted'),
      'click .reject-btn': _.bind(this.changeStatus, this, 'denied', this.options.token),
      'click .accept-btn': _.bind(this.changeStatus, this, 'accepted', this.options.token)
    }
  },

  initialize: function(options) {
    if (this.model) this.listenTo(this.model, 'change:sub_total', this.onPriceChange, this)
    if (this.model.get('isEditable')) {
      this.onOrderChange();
      this.updateAddressBlock();
    }
  },

  onPriceChange: function(model, value, options) {
    this.$el.find('.totals').html(Handlebars.partials.totals({order: this.model.toJSON()}));
  },

  changeStatus: function(status) {
    if (status = 'submitted') {
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
        return;
      }
    }

    var url = this.model.url();
    $.ajax({
      url: this.model.url() + '/status-history',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({status: status, review_token: this.options.token}),
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
    notes: '#order-notes'
  },

  fieldGetters: {
    guests: function() {
      return parseInt(this.$el.find('.order-form ' + this.fieldMap.guests).val());
    },
    datetime: function() {
      var datepart = this.$el.find('.order-form #order-date').val().trim();
      var timepart = this.$el.find('.order-form #order-time').val().trim();

      var date = new Date(datepart + ' ' + timepart);
      return date.toString() !== 'Invalid Date' ? date.toISOString() : null;
    }

  },

  getDiff: function() {
    var diff = {}

    for (var key in this.fieldMap) {
      var getter = this.fieldGetters[key];
      var val = getter ? getter.apply(this) : this.$el.find('.order-form ' + this.fieldMap[key]).val().trim();
      //TODO: validate
      if ((this.model.get(key) || val) && this.model.get(key) != val)
        diff[key] = val;
    }

    return _.size(diff) > 0 ? diff : null;
  },

  onOrderChange: function(e) {
    this.$el.find('.order-save-btn').toggleClass('hide', !this.getDiff());
  },

  onSave: function(e) {
    e.preventDefault();
    var view = this;
    this.model.save(this.getDiff(), {
      error: function(jqXHR, textStatus, errorThrown) { alert(errorThrown); },
      success: function(data, textStatus, jqXHR) { view.$el.find('.order-save-btn').addClass('hide'); }
    });
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
  }
});
