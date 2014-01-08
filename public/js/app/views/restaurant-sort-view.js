/**
 * This view handles sorting the restaurant listing
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var $ = require('jquery');
  var utils = require('utils');
  var Handlebars = require('hbs');

  return module.exports = Backbone.View.extend({
    events: {
      'change .sort': 'onSortChange'
    }

  , template: Handlebars.partials.restaurant_sort

  , initialize: function() {
      this.model.on('change:order_type', this.render, this);
    }

  , render: function() {
      this.$el.html(
        this.template({
          orderParams: this.model.toJSON()
        })
      );
    }

  , onSortChange: function(e) {
      this.trigger('sort:change');
      this.model.set('sort', e.target.value);
    }

  , getProps: function() {
      return { sort:  this.$el.find('.sort').val() };
    }
  });
});
