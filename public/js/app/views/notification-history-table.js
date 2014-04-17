define(function(require){
  'use strict';

  var utils = require('utils');
  var Hbs   = require('handlebars');

  var exports = utils.View.extend({
    events: {

    }

  , template: Hbs.partials.notification_history_table

  , initialize: function( options ){
      this.options = options || {};
      this.items = this.options.items || [];

      return this;
    }

  , setItems: function( items ){
      this.items = items;
      this.render();
      return this;
    }

  , render: function(){
      this.$el.html( this.template({ items: this.items } ) );
      this.$el.find('.btn-preview').preview({
        width: 630
      , height: 700
      });
      return this;
    }
  });

  return exports;
});