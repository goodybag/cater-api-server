if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var utils   = require('utils');
  var config  = require('config');

  return module.exports = utils.Model.extend({
    defaults: {
      
    }

  , initialize: function( attr, options ){
      return this;
    }

  , toJSON: function( options ){
      var obj = module.exports.__super__.toJSON.call( this, options );

      return obj;
    }
  });
});