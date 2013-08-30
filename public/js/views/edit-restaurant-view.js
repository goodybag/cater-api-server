var EditRestaurantView = FormView.extend({
  submitSelector: '.restaurant-form .restaurant-save',

  events: {
    'keyup .restaurant-form .form-control': 'onChange',
    'change .restaurant-form .form-control': 'onChange',
    'submit .restaurant-form': 'onSave'
  },

  initialize: function(options) {
    if (!this.model) this.model = new Restaurant();
    this.listenTo(this.model, 'sync', function() {
      this.$el.find('.restaurant-form .form-control').parent().removeClass('has-success');
    });
  },

  fieldMap: {
    name: '.restaurant-form .restaurant-name',
    phone: '.restaurant-form .restaurant-phone',
    email: '.restaurant-form .restaurant-email',
    price: '.restaurant-form .restaurant-price',
    cuisine: '.restaurant-form .restaurant-cuisine',
    minimum_order: '.restaurant-form .restaurant-minimum-order',
    delivery_fee: '.restaurant-form .restaurant-delivery-fee',
    street: '.restaurant-form .restaurant-street',
    city: '.restaurant-form .restaurant-city',
    state: '.restaurant-form .restaurant-state',
    zip: '.restaurant-form .restaurant-zip'
  },

  // TODO: do this automatically based on the model schema
  fieldGetters: {
    price: _.partial(FormView.intGetter, 'price'),
    minimum_order: _.compose(function(cents) { return Math.round(cents * 100); }, _.partial(FormView.floatGetter, 'minimum_order')),
    delivery_fee: _.compose(function(cents) { return Math.round(cents * 100); }, _.partial(FormView.floatGetter, 'delivery_fee')),
    cuisine: function() {
      var val = this.$el.find(this.fieldMap.cuisine).val().trim();
      return val ? _.invoke(val.split(','), 'trim') : [];
    }
  },

  onChange: function(e) {
    this.$el.find('.form-control').parent().removeClass('has-success');
    var diff = FormView.prototype.onChange.apply(this, arguments);
    if (diff) {
      var changed = _.values(_.pick(this.fieldMap, _.keys(diff))).join(', ');
      this.$el.find(changed).parent().filter(':not(.has-error)').addClass('has-success');
    }
  }
});
