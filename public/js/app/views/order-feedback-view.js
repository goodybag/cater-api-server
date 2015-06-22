define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.View.extend({
    events: {
      'mouseover .star': 'onMouseOver'
    , 'click .star': 'setRating'
    , 'click .btn-submit-feedback': 'submit'
    }

  , fieldMap: {
      rating: '.star'
    , notes: '.order-feedback-notes'
    }

  , fieldGetters: {
      rating: function () {
        return this.$el.find(this.fieldMap.rating).filter(function (i, el) {
          return $(el).data('selected');
        }).eq(0).data('rating');
      }
    }

  , onMouseOver: function(e) {
      e.preventDefault();
      this.clearStars();
      this.fillStars(e.target);
    }

  , setRating: function (e) {
      e.preventDefault();
      $('.star').data('selected', false);
      $(e.target).data('selected', true);

      this.$el.find('.order-feedback-notes-container').removeClass('hide');
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
      , ease_of_submitting_rating: this.fieldGetters.rating.call(this)
      , submitting_notes: this.$el.find(this.fieldMap.notes).val() || null
      };

      if (!feedback.ease_of_submitting_rating) {
        return;
      }

      $.ajax({
        type: 'PUT'
      , url: '/api/order-feedback'
      , dataType: 'JSON'
      , data: feedback
      , success: function () {
          this_.$el.find('.order-feedback-form').text('thank you!');
        }
      , error: function (error) {
          console.error(error);
        }
      });
    }

  });
});
