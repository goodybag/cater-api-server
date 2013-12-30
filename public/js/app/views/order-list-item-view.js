define(function(require, exports, module) {
  var $ = require('jquery');
  var utils = require('utils');
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var CopyErrorModalView = require('app/views/copy-error-modal');

  return module.exports = Backbone.View.extend({
    events: {
      'click .copy-order-btn': 'copyOrder'
    , 'click .cancel-order-btn': 'cancelOrder'
    , 'click  .btn-receipt': 'downloadReceipt'
    , 'click .reviewed-checkbox': 'toggleReviewed'
    }

  , template: Handlebars.partials.order_list_item

  , copyOrder: function(e) {
      e.preventDefault();

      var copyErrorModal = new CopyErrorModalView({el: '#copy-order-error-modal'});

      this.model.copy(function(err, newOrder) {
        if (err) {
          copyErrorModal.setModel(order);
          copyErrorModal.$el.modal('show');
        } else {
          var queryParams = {
            copy: true
          };

          if (newOrder.get('lostItems')) queryParams.lostItems = utils.pluck(newOrder.get('lostItems'), 'name');
          window.location = utils.result(newOrder, 'url') + utils.queryParams(queryParams);
        }
      });
    }

  , render: function() {
      var context = this.model.toJSON();
      if (this.options.hideUserDetails)
        context.parent = {hideUserDetails: this.options.hideUserDetails};

      return this.template(context);
    }

  , cancelOrder: function(e) {
      e.preventDefault();

      var self = this;

      this.model.changeStatus('canceled', true, function(error, result) {
        if (error) return alert('Sorry we were unable to cancel that order.');

        self.$el.html(self.render());
      });
    }

  , downloadReceipt: function(e) {
      e.preventDefault();

      var $el = $(e.currentTarget);
      var url = '/receipts/order-'+this.model.id+'.pdf';
      var name = 'Order' + this.model.id + 'Receipt'; // no spaces or punctuation because IE is a bitch

      if ($el.data('target') === '_blank'){
        window.open(url, name);
      } else {
        window.location = url;
      }
    }

  , toggleReviewed: function(e) {
      var reviewed = $(e.target).is(':checked');
      this.model.changeReviewed( reviewed, function(error) {
        if (error) return alert('Sorry we were unable to mark this order');
      });
    }
  });
});