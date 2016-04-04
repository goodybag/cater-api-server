/**
 * Orders.Fulfillability
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var _ = require('lodash');
  var moment = require('moment-timezone');
  var Base = require('./base');

  var Fulfillability = exports = require('stampit')()
    .state({
      timezone: 'UTC'
    , dateFormat: 'YYYY-MM-DD'
    , timeFormat: 'HH:mm a'
    , availabilityTimeFormat: 'HH:mm:ss'
    , restaurant: {}
      // Whether or not we should ignore the time
      // When we initialize with just `date`, we may not have a time
      // and the consumer may wish to ignore strategies which concern
      // themselves with `time`
    , ignoreTime: false
    })
    .enclose( function(){
      if ( this.date ){
        if ( this.time ){
          this.datetime = moment.tz(
            this.date + ' ' + this.time
          , [ this.dateFormat, this.timeFormat ].join(' ')
          , this.timezone
          );
        } else {
          this.datetime = moment.tz(
            this.date
          , this.dateFormat
          , this.timezone
          );
        }
      } else if ( this.datetime ){
        this.datetime = moment.tz(
          this.datetime
        , [ this.dateFormat, this.timeFormat ].join(' ')
        , this.timezone
        );
      }
    })
    .methods({
      getFulfillmentRequirements: function( options ){
        var omit = options && options.omit || [];

        return Fulfillability.requirements
          .filter( function( strategy ){
            if ( strategy === undefined || strategy === null ){
              console.warn('OrderFulfillability attempted to omit an undefined or null strategy');
            }

            return omit.indexOf( strategy ) === -1;
          });
      }

    , isFulfillable: function( options ){
        return this.getFulfillmentRequirements( options )
          .every( function( strategy ){
            return strategy.fn.call( this );
          }.bind( this ));
      }

    , why: function( options ){
        return this.getFulfillmentRequirements( options )
          .filter( function( strategy ){
            return !strategy.fn.call( this );
          }.bind( this ))
          .map( function( strategy ){
            return strategy.name;
          }.bind( this ));
      }

    , getAllSupportedDeliveryZips: function(){
        var zips = [];

        if ( this.restaurant.supported_order_types.indexOf('delivery') > - 1 ){
          zips = this.restaurant.delivery_zips.map( function( dzip ){
            return _.pick( dzip, 'zip', 'fee' )
          });
        }

        if ( this.restaurant.supported_order_types.indexOf('courier') > - 1 ){
          zips = zips.concat( this.getDeliveryServiceZips() );
        }

        return zips;
      }

    , getAllSupportedLeadTimes: function(){
        var supported = this.restaurant.supported_order_types;

        var r = this.restaurant;

        return []
          .concat( supported.indexOf('delivery') > -1 ? r.lead_times : [] )
          .concat( supported.indexOf('courier') > -1 ? r.pickup_lead_times : [] );
      }

    , getDeliveryServiceZips: function(){
        var originZips = this.getAllOriginZips();

        var dszips = this.restaurant.region.delivery_services.map( function( ds ){
          return ds.zips
            .filter( function( dszip ){
              return originZips.indexOf( dszip.from ) > -1;
            })
            .map( function( dszip ){
              return { zip: dszip.to, fee: dszip.price };
            });
        });

        return _.flatten( dszips );
      }

    , getAllOriginZips: function(){
        return [
          this.restaurant.zip
        ].concat(
          _.pluck( this.restaurant.locations, 'zip' )
        );
      }
    });

  // Since _all_ of these strategies are required to be fulfillable
  // put the computationally least complex strategies first
  var requirements = exports.requirements = [
    // Is the restaurant even open on that day?
    { name: 'OpenDay', fn: function strategyOpenDay(){
      if ( !this.datetime ) return true;

      var hours = this.restaurant.hours.concat( this.restaurant.delivery_hours );

      return !!_.findWhere( hours, {
        day: this.datetime.day()
      });
    }}

    // Restaurant is open on that day, but what about time?
  , { name: 'OpenHours', fn: function strategyOpenHours(){
      if ( !this.datetime ) return true;
      if ( this.ignoreTime ) return true;

      var day = this.datetime.day();

      var format = [ this.dateFormat, this.availabilityTimeFormat ].join(' ');
      var hms = ['hour', 'minute', 'second'];

      return this.restaurant.hours
        .concat( this.restaurant.delivery_hours )
        .filter( function( dayHours ){
          return dayHours.day === day;
        })
        .some( function( dayHours ){
          var startTime = _.object(
            hms
          , dayHours.start_time.split(':')
          );

          var endTime = _.object(
            hms
          , dayHours.end_time.split(':')
          );

          var startDate = this.datetime.clone();
          var endDate = this.datetime.clone();

          hms.forEach( function( component ){
            startDate.set( component, startTime[ component ] );
            endDate.set( component, endTime[ component ] );
          });

          return [
            startDate <= this.datetime
          , this.datetime < endDate
          ].every( _.identity );
        }.bind( this ));
    }}

  , { name: 'ClosedEvents', fn: function strategyClosedEvents(){
      var datetime = this.datetime;

      if ( !this.datetime ) datetime = moment.tz( this.timezone );

      if ( !Array.isArray( this.restaurant.events ) ) return true;

      return this.restaurant.events
        .filter( function( evt ){
          return evt.closed;
        })
        .every( function( evt ){
          var start = moment.tz( evt.during.start.value, this.dateFormat, this.timezone );
          var end   = moment.tz( evt.during.end.value, this.dateFormat, this.timezone );

          var compare = function( a, b, isStart, inclusive ){
            if ( isStart ){
              return inclusive ? a >= b : a > b;
            }

            return inclusive ? a <= b : a < b;
          }.bind( this );

          // Inner expression tests to see if datetime is between start/end
          return !(
            compare( datetime, start, true, evt.during.start.inclusive ) &&
            compare( datetime, end, false, evt.during.end.inclusive )
          );
        }.bind( this ));
    }}

    // Simply check if the zip is supported by delivery
  , { name: 'Zip', fn: function strategyZip(){
      if ( !this.zip ) return true;

      var zips = this.getAllSupportedDeliveryZips();

      return !!_.findWhere( zips, { zip: this.zip } );
    }}

    // Is there a lead time that satisfies?
  , { name: 'LeadTimes', fn: function strategyLeadTimes(){
      if ( !this.datetime ) return true;

      var leadTimes = this.getAllSupportedLeadTimes();

      if ( leadTimes.length === 0 ) return false;

      var minutes = moment.duration(
        this.datetime - moment.tz( this.timezone )
      ).asMinutes();

      return leadTimes
        .some( function( time ){
          return [
            minutes >= time.lead_time
          , !this.guests ? true : this.guests <= time.max_guests
          ].every( _.identity );
        }.bind( this ));
    }}

  , { name: 'MinimumOrder', fn: function strategyMinimumOrder(){
      if ( typeof this.restaurant.minimum_order !== 'number' ){
        return true;
      }

      var base = Base.create( this );

      return this.restaurant.minimum_order <= base.getSubTotal();
    }}
  ];

  requirements.forEach( function( strategy ){
    requirements[ strategy.name ] = strategy;
  });

  return exports;
});
