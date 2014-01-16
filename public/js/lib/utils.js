var isBrowser = true;
if (typeof module === 'object' && typeof define !== 'function') {
  isBrowser = false;
  var define = function(factory) {
    return module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var _ = require('lodash');
  var amanda = require('amanda');
  var helpers = require('./helpers');

  var Backbone = { View: { extend: function(){} } };
  if (isBrowser){
    Backbone = require('backbone');
  }

  _.mixin({
    objMap: function(obj, func, context) {
      return _.object(_.keys(obj), _.map(obj, func, context));
    },

    partialRight: function(func) {
      var args = Array.prototype.slice.call(arguments, 1);
      return function() {
        return func.apply(this, Array.prototype.slice.apply(arguments).concat(args));
      };
    }
  });

  var utils = _.extend({}, _, helpers);

  utils.validator = amanda('json');

  utils.Backbone    = Backbone;
  utils.Events      = Backbone.Events;
  utils.Model       = Backbone.Model;
  utils.Collection  = Backbone.Collection;
  utils.Router      = Backbone.Router;
  utils.History     = Backbone.History;

  utils.View        = Backbone.View.extend({
    /**
     * Displays errors next to the form field pertaining to the error
     *
     * displayErrors2([
     *   { property: 'card_number', message: '`555` is not a valid card number' }
     * ])
     *
     * Or Amanda style errors will be converted:
     *
     * displayErrors2({
     *   '0': {...}
     *   '1': {...}
     * })
     *
     * Optionally pass in a Model that has the fieldNounMap exposed
     * to convert property names to nicer names
     *
     * @param  {Array}  errors Array of error objects
     * @param  {Object} Model  Model to reference for field-noun-map
     */
    displayErrors2: function( errors, Model ){
      var this_ = this;
      var error, $el, $parent;
      var template = Handlebars.partials.alert_error;
      var selector = '[name="{property}"]';

      // Amanda errors object
      if ( _.isObject( errors ) && !_.isArray( errors ) ){
        errors = Array.prototype.slice.call( errors )

        // We're just going to use the `required` error text for everything
        // so just take the unique on error.property
        errors = _.chain(errors).map( function( error ){
          return error.property;
        }).unique().map( function( property ){
          var message;
          var noun = property;

          if ( Model && typeof Model.fieldNounMap === 'object' )
          if ( property in Model.fieldNounMap ){
            noun = Model.fieldNounMap[ property ];
          }

          message = this_.errorTypeMessages.required.replace(
            '{noun}', noun
          );

          return {
            property: property
          , message: message
          };
        }).value();
      }

      var css = {
        position: 'absolute'
      , top: '11px'
      };

      for ( var i = 0, l = errors.length; i < l; ++i ){
        error = errors[i];

        $el = $( template( error ) );
        $el.css( css );

        $parent = this.$el.find(
          selector.replace( '{property}', error.property )
        ).parents('.form-group').eq(0);

        $parent.prepend( $el );
        $parent.addClass('has-error');

        $el.css( 'right', 0 - $el[0].offsetWidth );
      }

      // Scroll to the first error
      $(document.body).animate({ scrollTop: this.$el.find('.has-error').eq(0).offset().top - 20 });
    }
  });

  utils.startHistory = function(){
    console.log('starting history');
    utils.history = Backbone.history;
    utils.history.start();
    utils.navigate = function(){ utils.history.navigate.apply(utils.history, arguments); };
  };

  return module.exports = utils;
});