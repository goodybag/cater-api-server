var Restaurant = Backbone.Model.extend({
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        required: true
      },
      sms_phone: {
        type: ['string', 'null'],
        length: 10,
        pattern: /^\d*$/, //contains only digits
        required: false
      },
      voice_phone: {
        type: ['string', 'null'],
        length: 10,
        pattern: /^\d*$/, //contains only digits
        required: false
      },
      email: {
        type: 'string',
        format: 'email',
        required: true
      },
      price: {
        type: 'integer',
        minimum: 1,
        maximum: 4,
        required: true
      },
      cuisine: {
        type: 'array',
        uniqueItems: true,
        items: {
          type: 'string',
          minLength: 1,
          pattern: /^[\w\-]*$/ // consists only of word characters or hyphen
        }
      },
      minimum_order: {
        type: ['integer', 'null'],
        minimum: 0
      },
      delivery_fee: {
        type: ['integer', 'null'],
        minimum: 0
      },
      street: {
        type: 'string',
        minLength: 1,
        required: true
      },
      city: {
        type: 'string',
        minLenght: 1,
        required: true
      },
      state: {
        type: 'string',
        length: 2,
        pattern: /^[A-Z]*$/, // only capital letters
        enum: _.pluck(states, 'abbr'),
        required: true
      },
      zip: {
        type: 'string',
        length: 5,
        pattern: /^\d*$/, // only digits
        required: true
      }
    }
  },

  // TODO: extract to superclass
  validator: amanda('json'),

  validate: function(attrs, options) {
    return this.validator.validate(attrs, this.schema, options || {}, function(err) { return err; });
  },

  urlRoot: '/restaurants',

  initialize: function(attrs, options) {
    attrs = attrs || {};
    options = options || {};

    this.categories = attrs.categories instanceof Categories ? attrs.categories : new Categories(attrs.categories || [], {restaurant: this});
    this.unset('categories');
  },

  isValidDeliveryTime: function( date ){
    if ( !(date.getDay() in this.get('delivery_times')) ) return false;

    var hours = this.get('delivery_times')[ date.getDay() ];
    var time = moment( date ).format('hh:mm:ss');

    return _.filter( hours, function( openClose ){
      return time >= openClose[0] && time < openClose[1]
    }).length === hours.length;
  },

  isValidMaxGuests: function( num ){
    return num <= this.get('max_guests');
  },

  isValidGuestDateCombination: function( guests, date ){
    var limit = _.find(_.sortBy(this.get('lead_times'), 'max_guests'), function(obj) {
      return obj.max_guests >= guests;
    });

    if ( !limit ) return false;

    var hours = (date - new Date()) / 3600000;

    return hours > limit.lead_time;
  },

  isValidOrderParams: function( params ){
    return this.validateOrderParams( params ).length === 0;
  },

  validateOrderParams: function( params ){
    var errors = [];

    // Check zips
    if ( this.get( 'delivery_zips' ).indexOf( params.get('zip') ) === -1 ){
      errors.push( 'is_bad_zip' );
    }

    // Check delivery times
    if ( !this.isValidDeliveryTime( params.getDateTime() ) ){
      errors.push( 'is_bad_delivery_time' );
    }

    // Check max_guests
    if ( !this.isValidMaxGuests( params.get('guests') ) ){
      errors.push( 'is_bad_guests' );
    }

    // Check lead times
    if (
      !this.isValidGuestDateCombination( params.get('guests'), params.getDateTime() ) &&
      // Ensure that we do not add this error if we've already got
      // an invalid delivery time
      errors.indexOf( 'is_bad_delivery_time' ) == -1 &&
      // Also ensure that we do not tell the user that they have a
      // bad lead time when they're already over the max guests
      errors.indexOf( 'is_bad_guests' ) == -1
    ){
      errors.push( 'is_bad_lead_time' );
    }

    return errors;
  },

  defaults: {
    cuisine: []
  }
});
