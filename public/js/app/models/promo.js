if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var utils   = require('utils');
  var api     = require('api');

  return module.exports = utils.Model.extend({

    initialize: function( attr, options ){
      this.attributes.recipients = this.attributes.recipients || [];
      this.attributes.type = "";
      this.attributes.name = "";

      return this;
    },

    save: function( attr, callback ) {
      this.set( attr );

      if( !this.attributes.created_at ) {
        api('promos').post( this.attributes, ( error, result ) => {
          if( error ) { return callback( error ); }
          this.set( result );
          this.trigger('item:created');
          callback( null, result );
        });
      } else {
        api('promos')(this._previousAttributes.promo_code).put( this.attributes, ( error, result ) => {
          if( error ) { return callback( error ); }
          this.set( result );
          this.trigger('item:updated');
          callback( null, result );
        });
      }

    },

    destroy: function( promo_code, callback ) {
      api('promos')(promo_code).del(( error, result ) => {
        if( error ) { return callback( error ); }
        this.trigger('item:destroyed');
        callback( null, result );
      });
    }

  });
});
