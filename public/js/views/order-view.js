var OrderView = FormView.extend({
  events: {
    'click .btn-cancel': 'cancel',
    'click .copy-order-btn': 'makeCopy'
  },

  fieldMap: {
    datetime: '.order-datetime',
    guests: '#order-guests',
    name: '.order-name',
    notes: '#order-notes',
    tip: '.order-tip',
    tip_percent: '.tip-percent'
  },

  fieldGetters: {
    guests: _.partial(FormView.intGetter, 'guests'),

    tip: _.partial(FormView.dollarsGetter, 'tip'),

    datetime: function() {
      var date = this.$el.find("#order-form #order-date").val().trim();
      var time = this.$el.find("#order-form #order-time").val().trim();
      var datepart = date ? dateTimeFormatter(date) : null;
      var timepart = time ? timeFormatter(time, 'HH:mm:ss') : null;


      if(!datepart || !timepart) return null;

      // since we cannot determine offset, cannot format as ISO 8601 String
      // using "YYYY-MM-DD HH:mm:ss" to represent the date and time
      var datetime = datepart + ' ' + timepart;
      var date = moment(datetime);
      return date.isValid() ? datetime : null;
    }
  },

  getDiff: function() {
    var diff = FormView.prototype.getDiff.apply(this, arguments);
    var addrDiff = this.addressView.getDiff.apply(this.addressView, arguments)
    return diff || addrDiff ? _.extend({}, diff, addrDiff) : null;
  },

  initialize: function(options) {
    this.addressView = new OrderAddressView({el: '.delivery-info', model: this.model.address, orderView: this});
    this.tipView = new TipView({el: '.tip-area', model: this.model, orderView: this});
    this.copyErrorModal = new CopyErrorModalView({el: '#copy-order-error-modal'});

    this.subViews = [this.addressView];

    // please add any model listeners in the setModel function
    this.setModel((this.model) ? this.model : new Order());
  },

  setModel: function(model) {
    if (this.model) this.stopListening(this.model);
    this.model = model;
    return this;
  },

  setItems: function(items) {
    // Replace sub order-item-views and listen to remove
    // events. Display alert when list is empty
    var self = this;
    _.each(this.items, 
      _.compose(
        _.bind(this.stopListening, this), 
        _.identity
      )
    );

    this.items = items;

    _.each(this.items, function(item) {
      self.listenTo(item, 'remove', function removeOrderItemView() {
        self.stopListening(item);
        self.items = _.without(self.items, item);
        if (!this.items.length) 
          this.$el.find('.order-empty-alert').removeClass('hide');
      });
    });
  },

  cancel: function() {
    this.model.changeStatus('canceled', function(err, data) {
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
  }
});
