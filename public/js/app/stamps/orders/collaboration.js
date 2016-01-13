if ( typeof module === 'object' && module && typeof module.exports === 'object' ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var config = require('config');

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

    , getOrderLinkHTML: function( collaborator ){
        return `
          <div>
            <a href="${this.getOrderURL( collaborator )}">Click here to place your orders</a>
          </div>
        `;
      }

    , getOrderURL: function( collaborator ){
        return `${config.baseUrl}/orders/${this.order.id}/add-items?edit_token=${collaborator.id}`;
      }

    , validate: function(){
        var errors;

        utils.validator.validate( this, OrderCollaboration.schema, { singleError: false }, function( _errors ){
          errors = _errors;
        });

        return errors ? Array.prototype.slice.call( errors ) : [];
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