if ( typeof module === 'object' && module && typeof module.exports === 'object' ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  return module.exports = require('stampit')()
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
    });
});