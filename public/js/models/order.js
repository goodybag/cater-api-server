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
          enum: _.pluck(states, 'abbr').concat([undefined, null]),
          required: false
        },
        zip: {
          type: ['string', 'null'],
          length: 5,
          required: false,
          pattern: /^\d*$/,
          enum: this.restaurant.get('delivery_zips')
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
          maximum: this.restaurant.get('max_guests'),
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

  defaults: {
    timezone: "America/Chicago"
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

    this.restaurant = new Restaurant(attrs.restaurant);
    this.unset('restaurant');

    if (this.get('id') == "undefined") this.unset('id');

    //TODO: maybe get a new collection on id change?
    this.listenTo(this.orderItems, 'change:sub_total add remove', function() {
      this.set('sub_total', _.reduce(this.orderItems.pluck('sub_total'), function(a, b) { return a + b; }, 0));
    }, this);

    this.listenTo(this.restaurant, 'change:is_bad_zip change:is_bad_delivery_time change:is_bad_lead_time change:is_bad_guests', function(model, value, options) {
      this.set('is_unacceptable', _.reduce(_.pick(model.toJSON(), ['is_bad_zip', 'is_bad_delivery_time', 'is_bad_lead_time', 'is_bad_guests']), function(a, b) {
        return a || b;
      }, false));
    }, this);

    this.on('change:sub_total', function(model, value, options) {
      model.set('below_min', value < model.restaurant.get('minimum_order'));
      model.setSubmittable(model, value, options);
    }, this);

    this.on({
      'change:zip': this.zipChanged,
      'change:datetime': this.datetimeChanged,
      'change:guests': this.guestsChanged,
      'change:is_unacceptable change:below_min': this.setSubmittable
    }, this);
  },

  setSubmittable: function(model, value, options) {
    model.set('submittable', model.get('sub_total') > 0 && !model.get('below_min') && !model.get('is_unacceptable'));
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
    model.restaurant.set('is_bad_zip', _.contains(model.restaurant.get('delivery_zips'), value));
  },

  checkLeadTimes: function() {
    var guests = this.get('guests');
    var limit = _.find(_.sortBy(this.restaurant.get('lead_times'), 'max_guests'), function(obj) {
      return obj.max_guests >= guests;
    });

    var then = this.get('datetime');
    var now = moment().tz(this.get('timezone')).format('YYYY-MM-DD HH:mm:ss');
    var hours = (new Date(then) - new Date(now)) / 3600000;

    this.restaurant.set('is_bad_lead_time', !limit ? true : hours <= limit.lead_time);
  },

  datetimeChanged: function(model, value, options) {
    if (!value) {
      model.restaurant.set({
        is_bad_delivery_time: null,
        is_bad_lead_time: null
      });
      return;
    }

    // check against restaurant hours
    var datetime = value.split(' ');
    var dow = new Date(datetime[0]).getDay();
    model.restaurant.set('is_bad_delivery_time', !_.find(model.restaurant.get('delivery_times')[dow], function(range) {
      return datetime[1] >= range[0] && datetime[1] <= range[1];
    }));

    model.checkLeadTimes();
  },

  guestsChanged: function(model, value, options) {
    if (value == null) {
      model.restaurant.set({
        is_bad_guests: null,
        is_bad_lead_time: null
      });
      return;
    }

    model.restaurant.set('is_guests_bad', value > model.restaurant.get('max_guests'));

    model.checkLeadTimes();
  },

  isFulfillableOrder: function(){
    return this.restaurant.validateOrderFulfillability( this ).length == 0;
  },

  validateOrderFulfillability: function(){
    var vals = ['guests', 'zip', 'datetime'].map( this.get.bind( this ) );

    // If they have blank fields, that's the only thing we need to tell them
    if ( vals.indexOf( null ) + vals.indexOf( undefined ) != -2 ){
      return ['has_blank_fields'];
    }

    return this.restaurant.validateOrderFulfillability( this );
  },

  toJSON: function() {
    var obj = Backbone.Model.prototype.toJSON.apply(this, arguments);
    obj.orderItems = this.orderItems.toJSON();
    obj.restaurant = this.restaurant.toJSON();
    return obj;
  }
});
