/*
* Show and Hide view elements.
* options: {
    trigger: '.toggle-btn'      // button or link to toggle view
  , showHide: '.showHide'       // class to be swapped, default is hide
  , targetSelector: '.mytoggle' // swap showhide class for this el
  }
*/
define(function (require, exports, module) {
  var utils = require('utils');

  return module.exports = utils.View.extend({
    events: function () {
      var events = {};
        events['click '+this.options.trigger] = 'showhide';
      return events;
    }

  , initialize: function () {
      console.log('init showhide')
      utils.defaults(this.options, {
        showHide: 'hide'
      });
    }

  , showHide: function (e) {
      if (e.preventDefaults) {
        e.preventDefaults();
      }
      var self = this;
      var toggleClass = e.target.getAttribute('data-toggle');
      var $targets = this.$el.find( this.options.targetSelector )

      $targets.each( function (i, target) {

        // remove data-togle classes from target element
        $(self.options.trigger).each(function (i, el) {
          target.classList.remove( el.getAttribute('data-toggle') );
        });

        target.classList.add( toggleClass );
      });
    }
  });
});