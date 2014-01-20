/**
 * FormView2
 *
 * A form view
 */

define(function(require){
  var Backbone  = require('backbone');
  var utils     = require('utils');
  var config    = require('config');

  return Backbone.View.extend({
    /**
     * Appends errors to the $errors param
     * @param  {Array}    errors  Amanda style errors array or object
     * @param  {Element}  $errors jQuery Element where errors go
     * @param  {Object}   Model   Model to pull the fieldNounMap from
     */
    displayErrors: function( errors, $errors, Model ){
      var this_ = this, error
      var frag = document.createDocumentFragment(), $el;
      var template = Handlebars.partials.alert_error;
      var selector = '[name="{property}"]';

      errors = utils.prepareErrors( errors, config.errorTypeMessages, Model );

      frag.innerHTML = "";
      for ( var i = 0, l = errors.length; i < l; ++i ){
        frag.innerHTML += template( errors[i] );
      }

      $errors.html( frag.innerHTML );

      // Highlight form fields with error
      this.$el.find('.has-error').removeClass('has-error');
      this.$el.find(
        '[name="' + utils.pluck( errors, 'property' ).join('"], [name="') + '"]'
      ).parent().addClass('has-error');
    }
  });
});