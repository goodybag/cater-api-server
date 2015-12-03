/**
 * Applies `focus` handlers to elements with `data-autoselect`
 * that automatically selects all text in the form control.
 */

define(function (require, exports, module) {
  return module.exports = {
    init: function( $ ){
      module.exports.applyToElement( $('[data-autoselect]') );
    }

  , applyToElement: function( $el ){
      $el.focus( function(){
        $(this).select();
      });
    }
  };
});