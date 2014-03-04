define(function(require){
  var utils = require('utils');

  return utils.View.extend({
    tagName: 'datalist'

  , initialize: function( options ){
      this.options = options;

      this.collection = options.collection;
      this.template   = options.template;

      this.collection.on( 'change', this.onCollectionChange, this );
      this.collection.on( 'add',    this.onCollectionChange, this );
      this.collection.on( 'remove', this.onCollectionChange, this );

      return this;
    }

  , render: function(){
      this.$el.html(
        this.template({
          collection: this.collection.toJSON()
        , options:    this.options
        })
      );

      return this;
    }

  , onCollectionChange: function(){
      this.render();
    }
  });
});