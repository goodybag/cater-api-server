var OrderView = Backbone.View.extend({
  model: Order,

  events: {
    'keyup .order-form .order-form-field': 'onOrderChange',
    'change .order-form .order-form-field': 'onOrderChange',
    'submit .order-form': 'onSave',
    'click .edit-address-btn': 'editAddress'
  },

  initialize: function(options) {
    if (this.model) this.listenTo(this.model, 'change:sub_total', this.onPriceChange, this)

    // events that need this
    _.extend(this.events, {
      'click .cancel-btn': _.bind(this.changeStatus, this, 'canceled'),
      'click .submit-btn': _.bind(this.changeStatus, this, 'submitted'),
      'click .reject-btn': _.bind(this.changeStatus, this, 'denied', this.options.token),
      'click .accept-btn': _.bind(this.changeStatus, this, 'accepted', this.options.token)
    });
  },

  onPriceChange: function(model, value, options) {
    // TODO: replace this with a handlebars partial, shared between server and client
    var sub = (value / 100).toFixed(2);
    var tax = (value * .000825).toFixed(2);
    var tot = (value * .010825).toFixed(2);

    this.$el.find('.price.sub-total').text(sub);
    this.$el.find('.price.tax').text(tax);
    this.$el.find('.price.total').text(tot);
  },

  changeStatus: function(status) {
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
    datetime: '#order-datetime',
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
      var date = new Date(this.$el.find('.order-form ' + this.fieldMap.datetime).val().trim());
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
    var addr = {
      street: this.$el.find('.address-street').val(),
      city: this.$el.find('.address-city').val(),
      state: this.$el.find('.address-state').val(),
      zip: this.$el.find('.address-zip').val()
    }
    $('.order-address-block').html(Handlebars.helpers.address(addr));
  }
});
