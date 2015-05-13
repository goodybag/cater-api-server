define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({
    events: {
      'mouseover .star': 'fillStar'
    , 'click .star': 'submit'
    }

  , fillStar: function(e) {
      e.preventDefault();
      this.clearStars();
      this.addStars(e.target);
    }

  , addStars: function (el) {
      var rating = +el.getAttribute('data-rating');
      this.$el.find('.star').each(function (i, star) {
        if (+star.getAttribute('data-rating') <= rating) {
          $(star).removeClass('gb-icon-star-empty').addClass('gb-icon-star');
        }
      });
    }

  , clearStars: function () {
      return this.$el.find('.star')
        .removeClass('gb-icon-star')
        .addClass('gb-icon-star-empty');
    }

  , submit: function (e) {
      e.preventDefault();
      var this_ = this;

      var feedback = {
        order_id: this.model.get('id')
      , question: 'How easy was your experience placing this order?'
      , rating: +e.target.getAttribute('data-rating')
      };

      $.ajax({
        type: 'POST'
      , url: '/api/orders/:oid/feedback'.replace(':oid', this_.model.get('id'))
      , dataType: 'JSON'
      , data: feedback
      , success: function () {
          this_.$el.find('.star-group').text('thank you!');
        }
      , error: function (error) {
          console.error(error);
        }
      });
    }

  });

});
