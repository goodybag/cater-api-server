if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');
  var utils = require('utils');
  var config = require('config');
  var _ = require('lodash');
  var moment = require('moment-timezone');
  var Handlebars = require('handlebars');
  var OrderItems = require('../collections/order-items');

  var Restaurant = require('./restaurant');
  var RestarantEvent = require('./restaurant-event');
  var OrderItem = require('./order-item');
  var Address = require('./address');

  var odsChecker = require('order-delivery-service-checker');

  var Order = Backbone.Model.extend({
    schema: function() {
      return {
        type: 'object',
        properties: {
          user_id: {
            type: ['string', 'integer', 'null']
          },
          restaurant_id: {
            type: ['string', 'integer'],
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
          pickup_datetime: {
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
            "enum": ['0', 'custom', '5', '10', '15', '18', '20', '25', null]
          },
          payment_status: {
            type: ['string', 'null'],
            required: false
          },
          payment_method_id: {
            type: ['string', 'number', 'null'],
            required: false
          },
          reviewed: {
            type: ['boolean', 'null'],
            required: false
          },
          type: {
            type: ['string', 'null'],
            required: false,
            "enum": ['pickup', 'delivery', 'courier', null]
          },
          lat_lng: {
            type: ['object', 'null'],
            required: false
          }
        }
      };
    },

    defaults: {
      timezone: "America/Chicago"
    , type: 'delivery'
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
        this.restaurant.validateOrderFulfillability( this )
      , this.validateRestaurantEvents()
      , this.validateAfterHours()
      );

      return errors.length > 0 ? errors : null;
    },

    /**
     * Check if the order datetime occurs during one of the
     * restaurant's closed events
     */
    validateRestaurantEvents: function() {
      var this_ = this;

      // this is super whack
      var errors = utils.reduce(this.restaurant.get('eventDateRanges'), function(memo, range) {
        var event = new RestarantEvent({during: range});
        var fce = event.toFullCalendarEvent();
        var orderDate = moment(this_.get('datetime'));

        var occursDuringEvent =
          orderDate.isAfter(fce.start) && orderDate.isBefore(fce.end) ||
          orderDate.isSame(fce.start, 'day') ||
          orderDate.isSame(fce.end, 'day');

        if( occursDuringEvent && !utils.contains(memo, 'restaurant_closed')) {
          memo.push('restaurant_closed');
        }

        return memo;
      }, []);

      return errors;
    },

    validateAfterHours: function(){
      var errors = [];

      if ( !this.attributes.datetime ) return errors;

      var now    = moment().tz( this.attributes.timezone );
      var end    = moment( this.attributes.datetime )
                    .tz( this.attributes.timezone )
                    .set( config.disallowOrdersBetween.end )
                    .startOf( 'minute' );
      var start  = moment( this.attributes.datetime )
                    .tz( this.attributes.timezone )
                    .subtract( 1, 'days' )
                    .set( config.disallowOrdersBetween.start )
                    .startOf( 'minute' );

      var datetime = moment( this.attributes.datetime )
                      .tz( this.attributes.timezone );

      // Both now and order date between after hours
      if ( now > start )
      if ( now < end )
      if ( datetime > start )
      if ( datetime < end ){
        errors.push('after_hours')
      }

      return errors;
    },

    urlRoot: '/orders',

    initialize: function(attrs, options) {
      var this_ = this;

      attrs = attrs || {};
      options = options || {};

      this.lockOrderType = false;

      if ( options.lockOrderType ){
        this.lockOrderType = true;
      }

      this.orderItems = new OrderItems(attrs.orderItems || [], {orderId: this.id, edit_token: options.edit_token });
      this.unset('orderItems');

      if ( !attrs.adjustment ){
        this.attributes.adjustment = {
          amount:       attrs.adjustment_amount || 0
        , description:  attrs.adjustment_description
        };
      }

      if ( attrs.restaurant.delivery_service ){
        this.set( 'delivery_service_id', attrs.restaurant.delivery_service.id );
      }

      this.restaurant = new Restaurant(attrs.restaurant);
      this.unset('restaurant');

      if (this.get('id') == "undefined") this.unset('id');

      if (!this.get('id')) this.set('editable', true);

      this.on('change:id', function(model, value, options) {
        this.orderItems.reset(model.attributes.orderItems || []);
        this.orderItems.orderId = model.id;
      });

      var fieldsThatShouldPromptCourierCheck = [
        'sub_total'
      , 'datetime'
      , 'zip'
      , 'guests'
      ].map( function( f ){
        return 'change:' + f
      }).join(' ');

      this.on( fieldsThatShouldPromptCourierCheck, this.updateOrderType, this);

      if (!options.ignoreOrderTypeInit) {
        this.updateOrderType();
      }

      this.on('change:amenities_total', this.updateSubtotal);

      this.listenTo(this.orderItems, 'change:sub_total add remove', this.updateSubtotal, this);

      var fieldsThatChangeTotal = [
        'sub_total'
      , 'adjustment'
      , 'user_adjustment_amount'
      , 'delivery_fee'
      , 'tip'
      ].map( function( f ){
        return 'change:' + f
      }).join(' ');

      this.on( fieldsThatChangeTotal, this.updateTotal, this);

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
        'change:is_unacceptable change:below_min': this.setSubmittable,
        'change:type': this.onOrderTypeChange
      }, this);
    },

    set: function(key, val, options) {
      // strip out updates to the address fields and proxy them through to the address model
      var attrs;
      if (key == null) return this;

      // TODO: same field names between order and address
      // See comment below
      var addressFields = _.keys(_.result(Address, 'schema').properties);
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else
        (attrs = {})[key] = val

      var addr = _.pick(attrs, addressFields);
      // Why do we take out the address fields from the top-level attributes?
      // attrs = _.omit(attrs, addressFields);

      if (attrs.address_name){
        addr.name = attrs.address_name;
      }

      if (this.address != null)
        this.address.set(addr, options);
      else
        this.address = new Address(addr);

      return Backbone.Model.prototype.set.call(this, attrs, options);
    },

    updateSubtotal: function() {
      var sub_total = _.reduce( this.orderItems.pluck('sub_total'), function(a, b) {
        return a + b;
      }, 0 ) || 0;

      sub_total += this.get('amenities_total') || 0;
      this.set( 'sub_total', sub_total );
    },

    updateTotal: function(){
      var total = this.get('sub_total') + this.get('adjustment').amount + this.get('delivery_fee');
      var rtotal = total;
      var noContractAmt = 0;
      var taxRate = this.restaurant && this.get('region')
        ? this.restaurant.get('region').sales_tax : config.taxRate;

      total  += this.get('user_adjustment_amount');
      this.attributes.sales_tax             = total * taxRate;
      this.attributes.restaurant_sales_tax  = rtotal * taxRate;
      total  += this.get('sales_tax');
      rtotal += this.get('restaurant_sales_tax');
      total  += this.get('tip');
      rtotal += this.get('tip');
      if ( this.restaurant ){
        if ( this.restaurant.get('plan_id') === null ){
          noContractAmt = total * this.restaurant.get('no_contract_fee')
          this.attributes.no_contract_amount = Math.round( noContractAmt );
          total += noContractAmt;
        }
      }
      this.set( 'total', Math.round( total ) );
      this.set( 'restaurant_total', Math.round( rtotal ) );
    },

    setSubmittable: function(model, value, options) {
      this.validate( this.toJSON(), function( errors ){
        if ( errors ){
          return model.set( 'submittable', false );
        }

        model.set('submittable', model.get('sub_total') > 0 && !model.get('below_min') && !model.get('is_unacceptable'));
      });
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
      model.restaurant.set('is_bad_zip', !this.restaurant.isValidZip(this));
    },

    checkLeadTimes: function() {
      this.restaurant.set( 'is_bad_lead_time', !this.restaurant.isValidGuestDateCombination( this ) );
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
      model.restaurant.set('is_bad_delivery_time', !model.restaurant.isValidDeliveryTime( value ) );

      if ( model.get('type') === 'courier' ){
        model.set(
          'pickup_datetime'
        , moment(
            model.get('datetime')
          ).add(
            -moment.duration( this.restaurant.attributes.region.lead_time_modifier ).asMinutes()
          , 'minutes'
          ).format('YYYY-MM-DD hh:mm:ss')
        );
      }

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
      var errors;
      this.validate( this.toJSON(), function( _errors ){
        errors = _errors;
      });

      if ( errors ){
        return false;
      }

      return this.restaurant.validateOrderFulfillability( this ).length == 0;
    },

    validateOrderFulfillability: function(){
      var isPresent = _.map(['guests', 'datetime'], _.bind(this.has, this)).concat(
        _.map(['zip'], _.bind(this.has, this.address)));

      // If they have blank fields, that's the only thing we need to tell them
      return _.every(isPresent) ? this.restaurant.validateOrderFulfillability( this ) : ['has_blank_fields'];
    },

    toJSON: function() {
      var obj = Backbone.Model.prototype.toJSON.apply(this, arguments);
      obj.orderItems = this.orderItems.toJSON();
      obj.restaurant = this.restaurant.toJSON();

      var addr = this.address.toJSON();
      addr.address_name = addr.name;
      delete addr.name;

      _.extend(obj, addr);
      obj.isAddressComplete = utils.reduce(
        utils.map(
          utils.pick(this.attributes, ['street', 'city', 'state', 'zip', 'phone'])
        , function(val) { return val != null && val !== ''; }
        )
      , function(memo, item, list) { return memo && item; }
      , true
      );
      return obj;
    },

    copy: function(callback) {
      var order = this;
      if (!_.isFunction(callback)) callback = function() {};
      $.ajax({
        type: 'POST',
        url: _.result(order, 'url') + '/duplicates',
        success: function(data, textStatus, jqXHR) {
          return callback(null, new order.constructor(_.extend(data, { restaurant: order.restaurant.toJSON() })));
        },
        error: function(jqXHR, textStatus, errorThrown) {
          return callback(errorThrown);
        }
      });
    },

    changeStatus: function(status, notify, review, callback) {
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
        url: _.result(this, 'url') + '/status-history' + ((notify === false) ? '?notify=false' : ''),
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
    },

    /**
     * Generate edit token and update this model
     * @param {function} callback(error)
     */
    generateEditToken: function(callback) {
      var this_ = this;
      $.ajax({
        type: 'POST',
        url: '/api/orders/' + this.id + '/generate_edit_token',
        error: function(jqXHR, textstatus, errorThrown) {
          return callback(errorThrown);
        },
        success: function(data, textstatus, jqXHR) {
          this_.set( utils.pick(data, 'edit_token', 'edit_token_expires') );
          return callback(null, data);
        }
      });
    },

    changeReviewed: function(reviewed, callback) {
      // Bypass model validation when toggling `reviewed` flag
      callback = callback || function() {};

      var data = {reviewed: reviewed};
      $.ajax({
        type: 'PUT'
      , url: _.result(this, 'url')
      , contentType: 'application/json'
      , data: JSON.stringify(data)
      , error: function(jqXHR, textstatus, error) {
          return callback(error);
        }
      , success: function(data, textstatus, jqXHR) {
          return callback(null);
        }
      });
    },

    /**
     * Convert datetime to a full calendar event object
     */
    getFullCalendarEvent: function() {
      var fullCalendarEvent = utils.extend({}, this.toJSON(), {
        title: [
          Handlebars.helpers.timepart(this.get('datetime'))
        , '\n'
        , Handlebars.helpers.truncate(this.restaurant.get('name'), 15)
        ].join('')
      , start: this.get('datetime')
      , color: this.getStatusColor()
      , orderId: this.get('id')
      , status: this.get('status')
      });

      return fullCalendarEvent;
    },

    getStatusColor: function() {
      switch (this.get('status')) {
        case 'pending':
          return '#F0AD4E';
        case 'canceled':
          return '#B3B3B3';
        case 'submitted':
          return '#5BC0DE';
        case 'accepted':
          return '#5CB85C';
        case 'denied':
          return '#D9534F';
        case 'delivered':
          return '#428BCA';
        default:
          return '#fff'
      }
    },

    shouldBeDeliveryService: function(){
      var order = _.extend( {}, this.attributes, {
        restaurant: this.restaurant.toJSON()
      });

      return odsChecker.check( order )
    },

    onOrderTypeChange: function( model, type, options ){
      if ( type === 'courier' ){
        model.restaurant.set( 'is_bad_zip', !this.restaurant.isValidZip(this) );

        model.set(
          'pickup_datetime'
        , moment(
            model.get('datetime')
          ).add(
            -moment.duration( this.restaurant.attributes.region.lead_time_modifier ).asMinutes()
          , 'minutes'
          ).format('YYYY-MM-DD hh:mm:ss')
        );
      }
    },

    updateOrderType: function(){
      if ( this.lockOrderType ) return;

      if ( this.shouldBeDeliveryService() ){
        this.set( 'type', 'courier' );
      } else {
        this.set( 'type', 'delivery' );
      }
    }
  }, {
    addressFields: ['street', 'street2', 'city', 'state', 'zip', 'phone', 'delivery_instructions']
  });

  return module.exports = Order;
});
