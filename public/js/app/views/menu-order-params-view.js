define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');

  var template = Handlebars.partials.menu_order_params;

  return module.exports = Backbone.View.extend({
    events: {
    }

  , template: template

  , initialize: function() {
      this.model.on("all", function(e) {
        console.log(e);
      });
    }

  , render: function(){

      return this;
    }
  });
});