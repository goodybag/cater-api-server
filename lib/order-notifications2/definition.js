var utils   = require('../../utils');
var db      = require('../../db');
var errors  = require('../../errors');

module.exports = function defFactoryFactory( def ){
  if ( !def.id )      throw new Error('Must provide def.id string');
  if ( !def.name )    throw new Error('Must provide def.name string');
  if ( !def.preview ) throw new Error('Must provide def.preview function');
  if ( !def.run )     throw new Error('Must provide def.run function');

  defFactory( def );
};

module.exports.defFactory = function defFactory( def ){
  return function notificationFactory( order, options ){
    if ( [ 'number', 'string' ].indexOf( typeof order ) > -1 ){
      order = { id: +order };
    }

    return Object.create( utils.extend({
      order:    order
    , def:      def
    , options:  options
    }, module.exports.notificationProto, def );
  };
}

module.exports.isValidOrder = function isValidOrder( order ){
  return utils.hasPropsDeep( this.order, [
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
  preview: function( callback ){
    if ( !this.isValidOrder() ){
      return this.fetchOrder( this.preview.bind( this ) );
    }

    this.def.preview( this.order, this.options, callback );

    return this;
  }

, send: function( callback ){
    if ( !this.isValidOrder() ){
      return this.fetchOrder( this.send.bind( this ) );
    }

    this.def.send( this.order, this.options, callback );

    return this;
  }

, fetchOrder: function( callback ){
    db.orders.findOne( this.order.id, module.exports.orderQueryOptions, function( error, order ){
      if ( error ) return callback( error );

      if ( !order ){
        return callback( errors.internal.NOT_FOUND );
      }

      this.order = order;
    }.bind( this ));
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

notifications.UserOrderAccepted(123)
  .send( function( error ){ ... })