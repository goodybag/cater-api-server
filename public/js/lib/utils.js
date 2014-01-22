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

  if (isBrowser){
    var $ = require('jquery');
    utils.dom = $;
    utils.domready = $;
  }

  utils.validator = amanda('json');

  utils.Backbone    = Backbone;
  utils.Events      = Backbone.Events;
  utils.Model       = Backbone.Model;
  utils.Router      = Backbone.Router;
  utils.History     = Backbone.History;
  utils.View        = Backbone.View;

  if ( isBrowser ){
    utils.Collection  = Backbone.Collection.extend({
      createModel: function( attr, options ){
        return this._prepareModel( attr, options );
      }

    , del: function( id, options ){
        return (
          this.get( id ) || this.createModel({ id: id })
        ).destroy( options );
      }
    });
  }

  utils.startHistory = function(){
    utils.history = Backbone.history;
    utils.history.start();
    utils.navigate = function(){ utils.history.navigate.apply(utils.history, arguments); };
  };

  /**
   * Transforms amanda-style errors into a useful array of
   * { property, message } objects. The messages string is
   * ready to be displayed by the view
   *
   * @param  {Object} errors            Or an array of errors
   * @param  {Object} errorTypeMessages Messages by error type
   * @param  {Object} Model             Holds the `fieldNounMap`
   * @return {Array}                    The resulting errors
   */
  utils.prepareErrors = function( errors, errorTypeMessages, Model ){
    var error;

    // Amanda errors object
    if ( _.isObject( errors ) && !_.isArray( errors ) ){
      errors = Array.prototype.slice.call( errors )
    }

    // We're just going to use the `required` error text for everything
    // so just take the unique on error.property
    return _.chain( errors ).unique( function( a ){
      return a.property;
    }).map( function( error ){
      var message, noun = error.property, type;

      if ( Model && typeof Model.fieldNounMap === 'object' )
      if ( error.property in Model.fieldNounMap ){
        noun = Model.fieldNounMap[ error.property ];
      }

      // Check to see if the property is specifically defined
      // Fallback to the validator type
      // If all else fails, use a general `field is required` error
      if ( error.property in errorTypeMessages ){
        type = error.property
      } else if ( error.validatorName in errorTypeMessages ){
        type = error.validatorName;
      } else {
        type = 'required';
      }

      // Use field nice names
      message = errorTypeMessages[ type ].replace(
        '{noun}', noun
      );

      // Ensure that the first letter of message is capitalized
      message = message[0].toUpperCase() + message.substring(1);

      return {
        property: error.property
      , message: message
      };
    }).value();
  };

  return module.exports = utils;
});