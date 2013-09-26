(function( exports ){
  var OptionsSetModel = exports.OptionsSetModel = Backbone.Model.extend({
    defaults: {
      options: []
    }

  , initialize: function( attrs, options ){
      if ( !this.attributes.id ) this.attributes.id = utils.uuid();

      this.attributes.options = new OptionsSetOptionsCollection( this.attributes.options );

      return this;
    }

  , toJSON: function(){
      var obj = _.extend( {}, this.attributes, {
        options: this.attributes.options.toJSON()
      });

      delete obj.edit;

      return obj;
    }

  // , sync: function( method, model, options ){
  //     if ( method === 'create' ){
  //       model.attributes.id = utils.uuid();
  //       this.baseModel.attributes.options_sets.push()
  //     }
  //   }
  });
})( window );