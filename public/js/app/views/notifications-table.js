define(function(require){
  'use strict';

  var utils = require('utils');
  var Hbs   = require('handlebars');

  var exports = utils.View.extend({
    events: {

    }

  , template: Hbs.partials.notifications_table

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
      return this;
    }
  });

  return exports;
});