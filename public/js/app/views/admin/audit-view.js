/**
 * Audit View
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');

  return utils.View.extend({
    events: {
      'click [role="create"]': 'onCreateClick'
    , 'click [role="remove"]': 'onRemoveClick'
    }

  , onCreateClick: function( e ){

    }

  , onRemoveClick: function( e ){
      
    }
  });
});