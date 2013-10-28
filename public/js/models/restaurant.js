var Restaurant = Backbone.Model.extend({
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        required: true
      },
      is_hidden: {
        type: 'boolean',
        required: 'true'
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
          pattern: /^[\w\-\/]*$/ // consists only of word characters or hyphen
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
    if (date == null) return true;
    if ( typeof date !== 'string' ) return false;

    if ( !moment(date).isValid() ) return false;

    // Super pro day-parsing
    var day = moment( date.split(' ')[0] ).day();

    if ( this.get('delivery_times')[ day ].length === 0 ) return false;

    var hours = this.get('delivery_times')[ day ];
    var time = (date.split(' ')[1] + ':00').substring( 0, 8 );

    // is the desired time within any of the windows for that day?
    return _.any( hours, function( openClose ){
      return time >= openClose[0] && time <= openClose[1]
    });
  },

  isValidMaxGuests: function( num ){
    // Non-number value, probably null or undefined
    if ( typeof this.get('max_guests') !== 'number' ) return true;

    // Impossible values, they probably meant to have no restrictions
    if ( this.get('max_guests') < 0 ) return true;

    return num <= this.get('max_guests');
  },

  isValidGuestDateCombination: function( order ){
    var date = order.get('datetime');
    if (date == null) return true;
    if ( typeof date !== 'string' ) return false;

    if ( !moment(date).isValid() ) return false;

    // In case of lead_times being null or an empty array
    // return true because there is nothing specified, so all must
    // be a allowed
    if ( this.get('lead_times') == null ) return true;

    if ( _.isArray( this.get('lead_times') ) && this.get('lead_times').length === 0 ){
      return true;
    }

    var limit = _.find(_.sortBy(this.get('lead_times'), 'max_guests'), function(obj) {
      return obj.max_guests >= order.get('guests');
    });

    if ( !limit ) return false;

    var now = moment().tz(order.get('timezone')).format('YYYY-MM-DD HH:mm:ss');
    var hours = (moment(date) - moment(now)) / 3600000;

    return hours >= limit.lead_time;
  },

  isValidOrder: function( order ){
    return this.validateOrder( order ).length === 0;
  },

  validateOrderFulfillability: function( order ){
    var errors = [];

    // Check zips
    if ( this.get( 'delivery_zips' ).indexOf( order.get('zip') ) === -1 ){
      errors.push( 'is_bad_zip' );
    }

    // Check delivery times
    if ( !this.isValidDeliveryTime( order.get('datetime') ) ){
      errors.push( 'is_bad_delivery_time' );
    }

    // Check max_guests
    if ( !this.isValidMaxGuests( order.get('guests') ) ){
      errors.push( 'is_bad_guests' );
    }

    // Check lead times
    if (
      !this.isValidGuestDateCombination( order ) &&
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
  , delivery_zips: []
  , lead_times: []
  }
});
