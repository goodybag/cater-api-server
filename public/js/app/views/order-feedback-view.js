define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({
    events: {
      'mouseover  .star':            'onMouseOver'
    , 'mouseleave .feedback-rating': 'onMouseLeave'
    , 'click      .star':            'submit'
    }

  , onMouseOver: function(e) {
      e.preventDefault();
      this.clearStars();
      this.fillStars(e.target);
    }

  , onMouseLeave: function (e) {
      e.preventDefault();
      this.clearStars();
    }

  , fillStars: function (el) {
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
      , ease_of_submitting_rating: +e.target.getAttribute('data-rating')
      };

      $.ajax({
        type: 'PUT'
      , url: '/api/order-feedback'
      , dataType: 'JSON'
      , data: feedback
      , success: function () {
          this_.$el.find('.feedback-rating').text('thank you!');
        }
      , error: function (error) {
          console.error(error);
        }
      });
    }

  });
});
