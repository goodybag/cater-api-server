/*
* Show and Hide view elements.
* options: {
*    trigger: '.toggle-btn'      // button or link to toggle view
*  , targetSelector: '.mytoggle' // swap showhide class for this el
*  }
*
* trigger: should have attribute data-class="className"
* 
*/
define(function (require, exports, module) {
  var utils = require('utils');

  return module.exports = utils.View.extend({
    events: function () {
      var events = {};
        events['click '+this.options.trigger] = 'showhide';
      return events;
    }

  , toggle: function (e) {
      if (e.preventDefaults) {
        e.preventDefaults();
      }
      $(this.options.trigger).removeClass('active');
      e.target.classList.add('active');

      var self = this;
      var toggleClass = e.target.getAttribute('data-class');
      var state = e.target.getAttribute('data-state');
      var $targets = this.$el.find( this.options.targetSelector )

      $targets.each( function (i, target) {
        if (toggleClass)
        if (state === target.getAttribute('data-state')) {
          target.classList.remove( toggleClass );
        } else {
          target.classList.add( toggleClass );
        }
      });
    }
  });
});