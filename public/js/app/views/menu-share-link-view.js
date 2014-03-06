/**
 *
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var utils = require('utils');
  var notify = require('notify');

  var template = Handlebars.partials.menu_order_params;

  return module.exports = Backbone.View.extend({
    events: {
      'click .share-link':          'highlightLink'
    , 'click .btn-generate-token':  'generateToken'
    , 'click .learn-more':          'clickLearnMore'
    },

    initialize: function() {
      this.popover();
      this.subscribeEvents();
    },

    popover: function() {
      this.$el.find('.learn-more').popover({
        container: 'body'
      , placement: 'left'
      , trigger: 'hover'
      , content: Handlebars.partials.share_link_popover()
      , html: true
      });
    },

    clickLearnMore: function(e) {
      e.preventDefault();
      this.$el.find('.learn-more').popover('toggle');
    },

    subscribeEvents: function() {
      this.model.on({
        'change:orderparams': this.show.bind(this)
      });
    },

    highlightLink: function(e) {
      $(e.target).select().focus();
    },

    generateToken: function(e) {
      var this_ = this;
      e.preventDefault();
      this.model.generateEditToken(function(err) {
        if (err)
          return notify.error(err);
        this_.showLinkView();
      });
    },

    showLinkView: function(token) {
      // Update link
      var $shareLinkView = this.$el.find('.share-link-view');
      var $shareLink = $shareLinkView.find('.share-link');
      var url = $shareLinkView.find('.share-link').val() + this.model.get('edit_token');

      // Show link
      this.$el.find('.generate-token-view').hide();
      $shareLink.val(url);
      $shareLinkView.removeClass('hide');
    },

    show: function() {
      this.$el.removeClass('hide');
    },

    hide: function() {
      this.$el.addClass('hide');
    }
  });
});
