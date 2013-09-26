(function( exports ){
  var OptionsGroupModel = exports.OptionsGroupModel = Backbone.Model.extend({
    defaults: {
      options: []
    }

  , initialize: function( options ){
      this.baseModel = options.baseModel;

      return this;
    }

  , save: function( data ){
      this.set( data );
      return this;
    }
  });
})( window );