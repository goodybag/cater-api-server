var EditRestaurantView = FormView.extend({
  submitSelector: '.restaurant-form .restaurant-save',

  events: {
    'keyup .restaurant-form .form-control': 'onChange',
    'change .restaurant-form .form-control': 'onChange',
    'submit .restaurant-form': 'onSave',
    'click .new-category': 'newCategory',
    'click .add-lead-time': 'addLeadTime'
  },

  initialize: function(options) {
    this.categories = [];
    this.setModel(this.model || new Restaurant());
    this.onChange();
  },

  remove: function() {
    _.invoke(this.categories, 'remove');
    FormView.prototype.remove.apply(this, arguments);
  },

  setModel: function(model) {
    this.stopListening(this.model);
    this.model = model;
    this.listenTo(this.model, {
      sync: function() {
        this.$el.find('.restaurant-form .form-control').parent().removeClass('has-success');
      },
      'change:sms_phone': utils.bind(this.formatPhone, this, 'sms_phone'),
      'change:voice_phone': utils.bind(this.formatPhone, this, 'voice_phone')
    });
    this.listenTo(this.model.categories, 'sort', this.sortCategories, this);
    return this;
  },

  fieldMap: {
    name: '.restaurant-form .restaurant-name',
    sms_phone: '.restaurant-form .restaurant-sms-phone',
    voice_phone: '.restaurant-form .restaurant-voice-phone',
    email: '.restaurant-form .restaurant-email',
    price: '.restaurant-form .restaurant-price',
    cuisine: '.restaurant-form .restaurant-cuisine',
    minimum_order: '.restaurant-form .restaurant-minimum-order',
    delivery_fee: '.restaurant-form .restaurant-delivery-fee',
    street: '.restaurant-form .restaurant-street',
    city: '.restaurant-form .restaurant-city',
    state: '.restaurant-form .restaurant-state',
    zip: '.restaurant-form .restaurant-zip',
    delivery_zips: '.restaurant-form .restaurant-delivery-zips',
    delivery_times: '.restaurant-form .time',
    lead_times: '.restaurant-form .lead-times'
  },

  // TODO: do this automatically based on the model schema
  fieldGetters: {
    price: _.partial(FormView.intGetter, 'price'),
    minimum_order: _.compose(function(cents) { return cents ? Math.round(cents * 100) : null; }, _.partial(FormView.floatGetter, 'minimum_order')),
    delivery_fee: _.compose(function(cents) { return cents != null ? Math.round(cents * 100) : null; }, _.partial(FormView.floatGetter, 'delivery_fee')),
    cuisine: function() {
      var val = this.$el.find(this.fieldMap.cuisine).val().trim();
      return val ? _.invoke(val.split(','), 'trim') : [];
    },

    sms_phone: function() {
      return this.$el.find(this.fieldMap.sms_phone).val().replace(/[^\d]/g, '') || null;
    },

    voice_phone: function() {
      return this.$el.find(this.fieldMap.voice_phone).val().replace(/[^\d]/g, '') || null;
    },

    delivery_zips: function() {
      var val = this.$el.find(this.fieldMap.delivery_zips).val().trim();
      return val ? _.invoke(val.split(','), 'trim') : [];
    },

    delivery_times: function() {
      var models = _.pluck(this.options.hours, 'model')
      return _.object(_.invoke(models, 'get', 'day'), _.invoke(models, 'toJSON'));
    },

    lead_times: function() {
      return _.compact(_.map(this.$el.find('.lead-time'), function(el) {
        var guests = parseInt($(el).find('.lead-max-guests').val());
        var hours = parseInt($(el).find('.lead-hours').val());
        return !_.isNaN(guests) && !_.isNaN(hours) ? {
          max_guests: !_.isNaN(guests) ? guests : null,
          lead_time:!_.isNaN(hours) ? hours : null
        } : null;
      }));
    }
  },

  onChange: function(e) {
    this.$el.find('.form-control').parent().removeClass('has-success');
    var diff = FormView.prototype.onChange.apply(this, arguments);
    if (diff) {
      var changed = _.values(_.pick(this.fieldMap, _.keys(diff))).join(', ');
      this.$el.find(changed).parent().filter(':not(.has-error)').addClass('has-success');
    }
  },

  newCategory: function() {
    var categoryView = new EditCategoryView({restaurant: restaurant});

    this.categories.push(categoryView);
    this.model.categories.add(categoryView.model, {sort: false});

    categoryView.render().attach();
  },

  sortCategories: function(collection, options) {
    this.categories = _.sortBy(this.categories, function(cat) {
      return cat.model.get('order');
    });

    _.invoke(this.categories, 'remove');
    _.invoke(this.categories, 'attach');
  },

  // TODO: generic field formatter system.
  formatPhone: function(field, model, value, options) {
    this.$el.find(this.fieldMap[field]).val(Handlebars.helpers.phoneNumber(value))
  },

  addLeadTime: function(e) {
    this.$el.find('.lead-times-list').append(Handlebars.partials.lead_time({}));
  }
});
