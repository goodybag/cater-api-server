if ( typeof module === 'object' && module && typeof module.exports === 'object' ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');

  var OrderCollaboration = require('stampit')()
    .state({
      collaborators: []
    })
    .methods({
      defaultSubject: function(){
        return ':name has invited you to work on an order'
          .replace( ':name', this.order.user.name );
      }

    , defaultMessage: function(){
        return 'Please select what you want to eat from :restaurant'
          .replace( ':restaurant', this.order.restaurant.name );
      }

    , validate: function(){
        var errors;
        console.log('validating', this);

        utils.validator.validate( this, OrderCollaboration.schema, { singleError: false }, function( _errors ){
          errors = _errors;
        });

        return errors;
      }
    });

  OrderCollaboration.schema = {
    type: 'object'
  , properties: {
      collaborators: {
        type: 'array'
      , items: {
          type: 'string'
        }
      }
    , subject: {
        type: 'string'
      , required: false
      }
    , message: {
        type: 'string'
      , required: false
      }
    }
  };

  return module.exports = OrderCollaboration;
});