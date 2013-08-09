var OrderView = Backbone.View.extend({
  model: Order,

  events: {
    'keyup .order-notes': 'onNotesChange',
    'submit .order-form': 'onSave',
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

    this.$el.find('.price.sub-total').val(sub);
    this.$el.find('.price.tax').val(tax);
    this.$el.find('.price.total').val(tot);
  },

  onNotesChange: function() {
    var notes = this.$el.find('.order-notes').val();
    var different = (notes || this.model.get('notes')) && notes !== this.model.get('notes');
    this.$el.find('.order-save-btn').toggleClass('hide', !different);
  },

  onSave: function(e) {
    this.model.save('notes', $('.order-notes').val(), {
      error: function(jqXHR, textStatus, errorThrown) { alert(errorThrown); },
      success: function(data, textStatus, jqXHR) { this.$el.find('.order-save-btn').addClass('hide'); }
    });
  },

  changeStatus: function(status, token) {
    $.ajax({
      url: this.model.url + '/status-history',
      type: post,
      contentType: 'application/json',
      data: JSON.stringify({status: status}),
      error: function(jqXHR, textStatus, errorThrown) { alert(errorThrown); },
      success: function(data, textStatus, jqXHR) { window.location.reload() }
    });
  }

});
