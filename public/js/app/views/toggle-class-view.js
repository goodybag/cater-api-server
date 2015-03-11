/*
* Toggle Class View
* options: {
*    trigger: '.toggle-btn'      // button or link to toggle view
*  , targetSelector: '.mytoggle' // swap class for this el
*  , cookie:  'cookie_name'      // persist state in browser cookie
*  }
*
* trigger: should have attributes data-class="className" and data-state="classState"
* 
*/
define(function (require, exports, module) {
  var utils = require('utils');
  var cookie = require('../../cookie');

  return module.exports = utils.View.extend({
    setState: function ( el ) {
      $(this.options.trigger).removeClass('active');
      el.classList.add('active');

      var toggleClass = el.getAttribute('data-class');
      var state = el.getAttribute('data-state');
      var $targets = this.$el.find( this.options.targetSelector )

      $targets.each( function (i, target) {
        if (toggleClass)
        if (state === target.getAttribute('data-state')) {
          target.classList.remove( toggleClass );
        } else {
          target.classList.add( toggleClass );
        }
      });

      // set state in local cookie
      if (this.options.cookie) {
        cookie.setItem(this.options.cookie, state);
      }
    }

  , toggle: function ( e ) {
      if (e.preventDefaults) {
        e.preventDefaults();
      }
      this.setState.call(this, e.target);
    }
  });
});