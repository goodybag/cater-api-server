define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');

  var OrderItems = require('../collections/order-items');

  var Restaurant = require('./restaurant');
  var OrderItem = require('./order-item');
  var Address = require('./address');

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
          guests: {
            type: ['integer', 'null'],
            minimum: 1,
            maximum: this.restaurant.get('max_guests') || undefined,
            required: false
          },
          datetime: {
           type: ['string', 'null'],
           // TODO: validate against format
           required: false
          },
          name: {
            type: ['string', 'null'],
            required: false
          },
          tip: {
            type: ['integer', 'null'],
            required: false,
            minimum: 0
          },
          tip_percent: {
            type: ['string', 'null'],
            required: false,
            enum: ['0', 'custom', '5', '10', '15', '18', '20', '25', null]
          },
          payment_status: {
            type: ['string', 'null'],
            required: false
          },
          payment_method_id: {
            type: ['string', 'number', 'null'],
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
      var errors = this.validator.validate(
        attrs,
        _.result(this, 'schema'),
        options || {},
        function(err) { return err; }
      ) || [];

      // Amanda result is not an array, it's just an object that looks like an array
      // cast it to an array
      if ( typeof errors === 'object' && !_( errors ).isArray() ){
        errors = Array.prototype.slice.call( errors );
      }

      var addressFields = _.keys(_.result(Address, 'schema').properties);
      if (!this.address._validate(_.extend({}, this.address.attributes, _.pick(attrs, addressFields)),
                                 _.extend({enforceRequired: false}, options))) {
        errors.push({addressErrors: this.address.validationError});
      }

      // Add on the restaurant fulfillability errors
      errors = errors.concat(
        // restaurant validate expects an order model and this instance does not
        // have all the attrs set
        this.restaurant.validateOrderFulfillability( new Order( _.extend(this.toJSON(), attrs) ) )
      );

      return errors.length > 0 ? errors : null;
    },

    urlRoot: '/orders',

    initialize: function(attrs, options) {
      attrs = attrs || {};

      this.orderItems = new OrderItems(attrs.orderItems || [], {orderId: this.id});
      this.unset('orderItems');

      this.restaurant = new Restaurant(attrs.restaurant);
      this.unset('restaurant');

      if (this.get('id') == "undefined") this.unset('id');

      this.on('change:id', function(model, value, options) {
        this.orderItems.reset(model.attributes.orderItems || []);
        this.orderItems.orderId = model.id;
      });

      this.on('change:adjustment', this.updateSubtotal, this);
      this.listenTo(this.orderItems, 'change:sub_total add remove', this.updateSubtotal, this);

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

    set: function(key, val, options) {
      // strip out updates to the address fields and proxy them through to the address model
      var attrs;
      if (key == null) return this;

      // TODO: same field names between order and address
      var addressFields = _.keys(_.result(Address, 'schema').properties);
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else
        (attrs = {})[key] = val

      var addr = _.pick(attrs, addressFields);
      attrs = _.omit(attrs, addressFields);

      if (this.address != null)
        this.address.set(addr, options);
      else
        this.address = new Address(addr);

      return Backbone.Model.prototype.set.call(this, attrs, options);
    },

    updateSubtotal: function() {
      this.set('sub_total',
               _.reduce(this.orderItems.pluck('sub_total'),
                        function(a, b) { return a + b; }, (this.get('adjustment') || 0).amount || 0)
              );
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
      model.restaurant.set('is_bad_zip', !_.contains(model.restaurant.get('delivery_zips'), value));
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
      var dow = moment(datetime[0]).day();
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

      model.restaurant.set('is_guests_bad', !model.restaurant.isValidMaxGuests(value));

      model.checkLeadTimes();
    },

    isFulfillableOrder: function(){
      return this.restaurant.validateOrderFulfillability( this ).length == 0;
    },

    validateOrderFulfillability: function(){
      var isPresent = ['guests', 'datetime'].map(_.bind(this.has, this)).concat(
        ['zip'].map(_.bind(this.has, this.address)))

      // If they have blank fields, that's the only thing we need to tell them
      return _.every(isPresent) ? this.restaurant.validateOrderFulfillability( this ) : ['has_blank_fields'];
    },

    toJSON: function() {
      var obj = Backbone.Model.prototype.toJSON.apply(this, arguments);
      obj.orderItems = this.orderItems.toJSON();
      obj.restaurant = this.restaurant.toJSON();
      _.extend(obj, this.address.toJSON());
      return obj;
    },

    copy: function(callback) {
      var order = this;
      if (!_.isFunction(callback)) callback = function() {};
      $.ajax({
        type: 'POST',
        url: _.result(order, 'url') + '/duplicates',
        success: function(data, textStatus, jqXHR) {
          return callback(null, new order.constructor(data));
        },
        error: function(jqXHR, textStatus, errorThrown) {
          return callback(errorThrown);
        }
      });
    },

    changeStatus: function(status, review, callback) {
      if (typeof review === 'function') {
        callback = review;
        review = null;
      }
      callback = callback || function() {};
      if (status == null || status === this.get('status')) return callback();
      var self = this;
      var data = {status: status};
      if (review) data.review_token = review;
      $.ajax({
        type: 'POST',
        url: _.result(this, 'url') + '/status-history',
        contentType: 'application/json',
        data: JSON.stringify(data),
        async: true,
        error: function(jqXHR, textstatus, errorThrown) {
          return callback(errorThrown);
        },
        success: function(data, textstatus, jqXHR) {
          self.set('status', data.status);
          return callback(null, data);
        }
      });
    }
  }, {
    addressFields: ['street', 'street2', 'city', 'state', 'zip', 'phone', 'delivery_instructions']
  });

  return module.exports = Order;
});