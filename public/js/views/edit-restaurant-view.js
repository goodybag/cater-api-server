var EditRestaurantView = FormView.extend({
  submitSelector: '.restaurant-form .restaurant-save',

  destroyMsg: [
    "Are you sure? This will destroy all restaurant data,",
    "including items, and categories. This will also cause",
    "orders from this restaurant to no longer be displayed.",
    "Do you want to continue?"
  ].join(' '),

  events: function() {
    return {
      'keyup .restaurant-form .form-control': 'onChange',
      'change .restaurant-form .form-control, .restaurant-form input': 'onChange',
      'submit .restaurant-form': 'onSave',
      'click .new-category': 'newCategory',
      'click .add-lead-time': 'addLeadTime',
      'click .add-sms-phone': 'addSmsPhone',
      'click .add-voice-phone': 'addVoicePhone',
      'click .add-email': 'addEmail',
      'click .remove-input': utils.bind(this.removeInput, this, '.removable'),
      'click .restaurant-remove': 'onRestaurantRemoveClick',
      'change input[type="filepicker"]': 'onFilePickerChange'
    };
  },

  initialize: function(options) {
    this.categories = [];
    this.setModel(this.model || new Restaurant());
    this.onChange();
    this.setTooltips();
    _.each(options.hours, function(view) {
      this.listenTo(view.model, 'change', this.onChange, this);
    }, this);
  },

  setTooltips: function() {
    this.$el.find('.remove-input').tooltip();
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
    logo_url: '.restaurant-form [name="logo_url"]',
    logo_mono_url: '.restaurant-form [name="logo_mono_url"]',
    sms_phones: '.restaurant-form .restaurant-sms-phones',
    voice_phones: '.restaurant-form .restaurant-voice-phones',
    emails: '.restaurant-form .restaurant-emails',
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
    lead_times: '.restaurant-form .lead-times',
    tags: '.restaurant-form .restaurant-tags input',
    is_hidden: '.restaurant-form .restaurant-is-hidden',
    meal_types: '.restaurant-form .restaurant-meal-types input'
  },

  fieldSplit: function(selector) {
    var val = this.$el.find(selector).val().trim();
    return val ? _.invoke(val.split(','), 'trim') : [];
  },

  // TODO: do this automatically based on the model schema
  fieldGetters: {
    price: _.partial(FormView.intGetter, 'price'),
    minimum_order: _.compose(function(cents) { return cents ? Math.round(cents * 100) : null; }, _.partial(FormView.floatGetter, 'minimum_order')),
    delivery_fee: _.compose(function(cents) { return cents != null ? Math.round(cents * 100) : null; }, _.partial(FormView.floatGetter, 'delivery_fee')),

    cuisine: function() { 
      return this.fieldSplit(this.fieldMap.cuisine); 
    },
    
    sms_phones: function() { 
      return _.invoke(this.fieldSplit(this.fieldMap.sms_phones), 'replace', /[^\d]/g, '');
    },
    
    voice_phones: function() { 
      return _.invoke(this.fieldSplit(this.fieldMap.voice_phones), 'replace', /[^\d]/g, '');
    },
    
    emails:  function() { 
      return this.fieldSplit(this.fieldMap.emails); 
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
        var cancel = parseInt($(el).find('.lead-cancel-time').val());
        return !_.isNaN(guests) && !_.isNaN(hours) ? {
          max_guests: !_.isNaN(guests) ? guests : null,
          lead_time:!_.isNaN(hours) ? hours : null,
          cancel_time: !_.isNaN(cancel) ? cancel : null
        } : null;
      }));
    },

    tags: function() {
      return _.pluck(this.$el.find(this.fieldMap.tags+ ':checked'), 'value');
    },

    meal_types: function() {
      return _.pluck(this.$el.find(this.fieldMap.meal_types + ':checked'), 'value');
    },

    is_hidden: function() {
      return this.$el.find(this.fieldMap.is_hidden).is(':checked');
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
  },

  /**
   * Clicking remove button removes the container
   * so we cull all the form labels, inputs, actions, etc
   */
  removeInput: function(selector, e) {
    e.preventDefault();
    $(e.target).closest(selector).remove();
    this.onChange(e);
  },

  addSmsPhone: function(e) {
    this.$el.find('.sms-phone-list').append(Handlebars.partials.edit_restaurant_sms_phone());
  },

  addVoicePhone: function(e) {
    this.$el.find('.voice-phone-list').append(Handlebars.partials.edit_restaurant_voice_phone());
  },

  addEmail: function(e) {
    this.$el.find('.email-list').append(Handlebars.partials.edit_restaurant_email());
  },

  onRestaurantRemoveClick: function(e){
    if ( !confirm( this.destroyMsg ) ) return;

    this.model.destroy({
      success: function(){ window.location.href = '/restaurants?edit=true'; }
    });
  },

  onFilePickerChange: function(e){
    var $input = $(e.originalEvent.target);
    $input.siblings('[data-name="' + $input.attr('name') + '"]').attr(
      'src', $input.val()
    );
  }
});
