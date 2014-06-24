/**
 * This view handles the order params
 * displayed on the menu pages.
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');

  var template = Handlebars.partials.menu_order_params;

  return module.exports = Backbone.View.extend({
    events: {
      'click .btn-change-order-params': 'showOrderModal'
    }

  , template: template

  , initialize: function() {
      var this_ = this;

      /**
       * Event `change:orderparams` is triggered by
       * adding items or clicking change order
       * params.
       */
      this.model.on("change:orderparams change:is_delivery_service", function(e) {
        this_.render();
      });

      this.render();
    }

  , render: function() {
      var $el = $( this.template({
        order: this.model.toJSON()
      }));

      this.$el.html( $el.html() );
    }

  , showOrderModal: function(e) {
      e.preventDefault();
      var this_ = this;

      this.options.orderModal.show({
        success: function(model, response, options) {
            model.trigger('change:orderparams');
            this_.options.orderModal.hide();
          }
        , error: function(){
            alert('sorry we were unable to change your order information, please refresh page and try again');
          }
      });
    }
  });
});