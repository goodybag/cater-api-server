/**
 * Search restaurants with typeahead plugin
 */

define(function(require, exports, module) {
  var $               = require('jquery');
  var utils           = require('utils');
  var typeahead       = require('typeahead');
  var Handlebars      = require('Handlebars');

  return module.exports = Backbone.View.extend({

    events: {},

    initialize: function() {
      var options = {
        minLength: 1
      , highlight: true
      };

      // instantiate the bloodhound suggestion engine
      var engine = new Bloodhound({
        name: 'restaurants'
      , limit: 10
      , remote: {
          url: '/restaurants/search?name=%QUERY'
        }
      , datumTokenizer: function(d) {
          return Bloodhound.tokenizers.whitespace(d.val);
        }
      , queryTokenizer: Bloodhound.tokenizers.whitespace
      });

      // initialize the bloodhound suggestion engine
      engine.initialize();
      this.$el.find('.search-input').typeahead(options, {
        displayKey: 'name'
      , source: engine.ttAdapter()
      , templates: {
          suggestion: Handlebars.partials.search_restaurant_option
        }
      });
    }
  });
});