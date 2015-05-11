var utils   = require('../../utils');
var db      = require('../../db');
var errors  = require('../../errors');
var app     = require('../../app');

var LOGGER = null;

module.exports = defFactoryFactory;
module.exports.defFactory = defFactory;
module.exports.isValidOrder = isValidOrder;

function defFactoryFactory( def ){
  if ( !def.id )      throw new Error('Must provide def.id string');
  if ( !def.name )    throw new Error('Must provide def.name string');
  if ( !def.build )   throw new Error('Must provide def.build function');
  if ( !def.send )    throw new Error('Must provide def.send function');

  return defFactory( def );
};

function defFactory( def ){
  return utils.extend( function notificationFactory( order, userId, options ){
    if ( [ 'number', 'string' ].indexOf( typeof order ) > -1 ){
      order = { id: +order };
    }

    if ( typeof userId !== 'number' && userId !== null ){
      throw new Error('Invalid userId');
    }

    options = utils.defaults( options || {}, {
      render: true
    });

    var notification = Object.create( utils.extend({
      order:    order
    , def:      def
    , options:  options
    }, module.exports.notificationProto ));

    // Throw an error if the passed in options are invalid
    notification.validateOptions();

    return notification;
  }, def );
}

function isValidOrder( order ){
  return utils.hasPropsDeep( order, [
    'restaurant'
  , 'restaurant.contacts'
  , 'user'
  , 'deliveryService'
  , 'orderItems'
  , 'region'
  , 'location'
  ]);
}

module.exports.notificationProto = {
  build: function( callback ){
    if ( !this.isValidOrder() ){
      return this.fetchOrder( function( error ){
        if ( error ) return callback( error );
        this.build( callback );
      }.bind( this ));
    }

    this.def.build( this.order, this.options, LOGGER, callback );

    return this;
  }

, send: function( callback ){
    this.build( function( error, build ){
      if ( error ) return callback( error );

      this.def.send( build, this.order, this.options, LOGGER, function( error ){
        if ( error ){
          return callback( error );
        }

        callback();

        process.nextTick( this.save.bind( this, build );
      }.bind( this ));
    }).bind( this );

    return this;
  }

, fetchOrder: function( callback ){
    db.orders.findOne( this.order.id, module.exports.orderQueryOptions, function( error, order ){
      if ( error ) return callback( error );

      if ( !order ){
        return callback( errors.internal.NOT_FOUND );
      }

      this.order = order;

      callback( null, order );
    }.bind( this ));

    return this;
  }

, validateOptions: function(){
    if ( !Array.isArray( this.def.requiredOptions ) ) return false;

    // Filter down to keys that are null/undefined in options obj
    var missing = this.def.requiredOptions.filter( function( k ){
      return ~[ null, undefined ].indexOf( this.options[ k ] );
    }.bind( this ));

    if ( !missing.length ) return false;

    throw utils.extend( {}, errors.internal.BAD_DATA, {
      message: 'Missing required properties'
    , details: missing
    });
  }

, isValidOrder: function(){
    return isValidOrder( this.order );
  }
};

module.exports.orderQueryOptions = {
  many:   [ { table: 'order_items', alias: 'orderItems' }
          , { table: 'transaction_errors', alias: 'transaction_errors' }
          ]
, one:    [ { table: 'restaurants'
            , alias: 'restaurant'
            , many: [ { table: 'amenities'
                      , alias: 'amenities'
                      , columns: [
                          '*'
                        , { type: 'exists'
                          , expression: {
                              type: 'select'
                            , columns: [ { expression: 1 } ]
                            , table: 'order_amenities'
                            , where: { order_id: '$orders.id$', amenity_id: '$amenities.id$' }
                            }
                          , alias: 'checked'
                          }
                        ]
                      }
                    , { table: 'contacts', alias: 'contacts'
                      , where: { disable_sms: false }
                      }
              ]
            }
          , { table: 'users', alias: 'user' }
          , { table: 'delivery_services', alias: 'deliveryService' }
          , { table: 'regions', alias: 'region', where: { id: '$restaurants.region_id$'} }
          , { table: 'restaurant_locations', alias: 'location' }
          ]
, joins:  [ { type: 'left', target: 'restaurants', on: { id: '$orders.restaurant_id$' } }
          ]
};