define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');
  var Categories = require('../collections/categories');
  var states = require('states');
  var utils = require('utils');

  var regex = {
    url: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
  };

  return module.exports = Backbone.Model.extend({
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
        display_phone: {
          type: ['string', 'null'],
          required: false,
          length: 10,
          pattern: /^\d*$/ //contains only digits
        },
        price: {
          type: 'integer',
          minimum: 1,
          maximum: 4,
          required: true
        },
        cuisine: {
          type: ['array', 'null'],
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
          "enum": _.pluck(states, 'abbr'),
          required: true
        },
        zip: {
          type: 'string',
          length: 5,
          pattern: /^\d*$/, // only digits
          required: true
        },
        logo_url: {
          type: ['string', 'null'],
          required: false,
          pattern: regex.url
        },
        logo_mono_url: {
          type: ['string', 'null'],
          required: false,
          pattern: regex.url
        },
        yelp_business_id: {
          type: ['string', 'null'],
          required: false
        },
        description: {
          type: ['string', 'null'],
          required: false
        },
        website: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
            format: 'uri'
          }
        },
        billing_email: {
          type: ['string', 'null'],
          minLength: 1,
          required: false
        },
        billing_street: {
          type: ['string', 'null'],
          minLength: 1,
          required: false
        },
        billing_street2: {
          type: ['string', 'null'],
          minLength: 1,
          required: false
        },
        billing_city: {
          type: ['string', 'null'],
          minLenght: 1,
          required: false
        },
        billing_state: {
          type: ['string', 'null'],
          length: 2,
          pattern: /^[A-Z]*$/, // only capital letters
          "enum": _.pluck(states, 'abbr').concat([null]),
          required: false
        },
        billing_zip: {
          type: ['string', 'null'],
          length: 5,
          pattern: /^\d*$/, // only digits
          required: false
        },
        gb_fee: {
          type: 'number'
        },
        is_direct_deposit: {
          type: 'boolean'
        },
        is_fee_on_total: {
          type: 'boolean'
        },
        disable_courier: {
          type: 'boolean'
        },
        region_id: {
          type: ['number', 'null']
        },
        delivery_service_order_amount_threshold: {
          type: ['number', 'null']
        },
        delivery_service_order_total_upperbound: {
          type: ['number', 'null']
        },
        delivery_service_head_count_threshold: {
          type: ['number', 'null']
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

      this.categories = attrs.categories instanceof Categories ?
        attrs.categories : new Categories(attrs.categories || [], {restaurant: this});
      this.unset('categories');

      if ( typeof this.get('gb_fee') === 'string')
        this.set('gb_fee', Number( this.get('gb_fee') ));
    },

    isValidDeliveryTime: function( date ){
      if (date == null) return true;
      if ( typeof date !== 'string' ) return false;

      if ( !moment(date).isValid() ) return false;

      var this_ = this;

      // Super pro day-parsing
      var day = moment( date.split(' ')[0] ).day();

      if ( this.get('delivery_times')[ day ].length === 0 )
      if ( this.get('hours_of_operation')[ day ].length === 0 ){
       return false;
      }

      var hours = this.get('delivery_times')[ day ];
      var time = (date.split(' ')[1] + ':00').substring( 0, 8 );

      // is the desired time within any of the windows for that day?
      var result = _.any( hours, function( openClose ){
        return time >= openClose[0] && time <= openClose[1]
      });

      // Restaurant couldn't ful-fill, what about delivery services?
      if ( !result ){
        date  = moment( date ).add( 'minutes', -this.get('region').lead_time_modifier || 0 );
        day   = date.day();
        hours = this.get('delivery_times')[ day ];
        time  = date.format('HH:mm:ss');

        result = _.chain(
          this.get('hours_of_operation')[ day ]
        ).any( function( openClose ){
          return time >= openClose[0] && time <= openClose[1]
        }).value();
      }

      return result;
    },

    getLeadTime: function(order) {
      // Get the lowest lead time per guest amt
      var limit = _.find(_.sortBy(this.get('lead_times'), 'max_guests'), function(obj) {
        return obj.max_guests >= order.get('guests');
      });
      return limit || 0;
    },

    getDeadline: function(order) {
      // the leadtime deadline
      var leadtime  = this.getLeadTime(order).lead_time;
      return moment(order.get('datetime')).subtract(leadtime, 'minutes');
    },

    getTimeLeft: function(order) {
      // returns the time left to order in minutes (based on guests/datetime)
      var deadline  = this.getDeadline(order);
      var now       = moment();
      var timeleft  = deadline.diff(now, 'minutes', true);
      return timeleft;
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

      // Ensure datetime is valid
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

      // Get the lowest lead time per guest amt
      var limit = this.getLeadTime(order);

      // get the current time
      var now = moment().tz(order.get('timezone')).format('YYYY-MM-DD HH:mm:ss');

      // get delta between order datetime and now
      var minutes = (moment(date) - moment(now)) / 60000;

      // get lead time
      var leadTime = limit.lead_time;

      // plenty of time? good to go
      if ( limit && minutes >= leadTime ) return true;

      // disabled courier so don't bother checking pickup lead times
      if ( this.get('disable_courier') ) return false;

      // not enough leadtime bro
      if ( !limit || minutes < leadTime ){
        limit = _.find(_.sortBy(this.get('pickup_lead_times'), 'max_guests'), function(obj) {
          return obj.max_guests >= order.get('guests');
        });
      }

      if ( !limit ) return false;

      leadTime = limit.lead_time;
      leadTime += moment.duration( this.get('region').lead_time_modifier ).asMinutes();

      return minutes >= leadTime;
    },

    isValidZip: function( order ){
      var zips = this.get('delivery_zips');

      if ( order.get('type') === 'courier' ){
        zips = this.get('delivery_service_zips');
      }

      return zips.indexOf( order.address.get('zip') ) > -1;
    },

    isValidOrder: function( order ){
      return this.validateOrder( order ).length === 0;
    },

    validateOrderFulfillability: function( order ){
      var errors = [];

      if ( !this.isValidZip( order ) ){
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
    , gb_fee: 0.1275
    }
  });
});
