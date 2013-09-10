var OrderItems = Backbone.Collection.extend({
  initialize: function(models, options) {
    if (options && options.orderId) this.orderId = options.orderId;
  },
  url: function() { return '/orders/' + this.orderId + '/items' },
  model: OrderItem
});

var Order = Backbone.Model.extend({
  schema: function() {
    return {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          minLength: 1,
          required: true
        },
        restaurant_id: {
          type: 'string',
          minLength: 1,
          required: true
        },
        street: {
          type: ['string', 'null'],
          minLength: 1,
          required: false
        },
        city: {
          type: ['string', 'null'],
          minLength: 1,
          required: false
        },
        state: {
          type: ['string', 'null'],
          length: 2,
          enum: _.pluck(states, 'abbr'),
          required: false
        },
        zip: {
          type: ['string', 'null'],
          length: 5,
          required: false,
          pattern: /^\d*$/,
          enum: this.get('restaurant').delivery_zips
        },
        phone: {
          type: ['string', 'null'],
          length: 10,
          pattern: /^\d*$/, //contains only digits
          required: false
        },
        guests: {
          type: ['integer', 'null'],
          minimum: 1,
          maximum: this.get('restaurant').max_guests,
          required: false
        },
        notes: {
          type: ['string', 'null'],
          required: false
        },
       datetime: {
         type: ['string', 'null'],
         // TODO: validate against format
         required: false
       }
      }
    };
  },

  // TODO: extract to superclass
  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
  },

  urlRoot: '/orders',

  initialize: function(attrs, options) {
    attrs = attrs || {};
    this.orderItems = new OrderItems(attrs.orderItems || [], {orderId: this.id});
    this.unset('orderItems');
    //TODO: maybe get a new collection on id change?
    this.listenTo(this.orderItems, 'change:sub_total add remove', function() {
      this.set('sub_total', _.reduce(this.orderItems.pluck('sub_total'), function(a, b) { return a + b; }, 0));
    }, this);

    this.on('change:sub_total', function(model, value, options) {
      model.set('below_min', value < model.get('restaurant').minimum_order);
      model.set('submittable', value > 0 && !model.get('below_min'));
    }, this);

    this.on({
      'change:zip': this.zipChanged,
      'change:datetime': this.datetimeChanged,
      'change:guests': this.guestsChanged
    }, this);
  },

  requiredFields: [
    'datetime',
    'street',
    'city',
    'state',
    'zip',
    'phone',
    'guests'
  ],

  zipChanged: function(model, value, options) {
    var restaurant = model.get('restaurant');
    restaurant.is_zip_bad = _.contains(restaurant.zips, value);
    model.set('restaurant', restaurant);
  },

  datetimeChanged: function(model, value, options) {
    if (!value) return;
    var restaurant = model.get('restaurant');

    // check against restaurant hours
    var datetime = value.split(' ');
    var dow = new Date(datetime[0]).getDay();
    restaurant.is_bad_delivery_time = !_.find(restaurant.delivery_times[dow], function(range) {
      return datetime[1] >= range[0] && datetime[1] <= range[1];
    });

    // check against lead times
    var guests = model.get('guests');

    var limit = _.find(_.sortBy(restaurant.lead_times, 'guests'), function(obj) { return obj.guests >= guests; });
  },

  guestsChanged: function(model, value, options) {
    var restaurant = model.get('restaurant');
    if (value > restaurant.max_guests) {
      restaurant.is_guests_bad = true;
      models.set('restaurant', restaurant);
    }

    // TODO: check lead times
  },

  toJSON: function() {
    var obj = Backbone.Model.prototype.toJSON.apply(this, arguments);
    obj.orderItems = this.orderItems.toJSON();
    return obj;
  }
});
