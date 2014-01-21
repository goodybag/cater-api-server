define(function(require){
  var utils = require('utils');

  return utils.View.extend({
    tagName: 'table'

  , initialize: function( options ){
      this.collection = options.collection;
      this.template   = options.template;

      this.collection.on( 'reset', this.onCollectionReset, this );

      return this;
    }

  , render: function(){
      this.$el.html(
        this.template({
          collection: this.collection.toJSON()
        })
      );

      return this;
    }

  , onCollectionReset: function(){
      this.render();
    }
  });
});