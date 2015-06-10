if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var isBrowser = typeof isNode === 'undefined';

  var _ = require('lodash');
  var amanda = require('amanda');
  var helpers = require('./helpers');
  var Backbone = require('backbone');
  var async = require('async');

  if (isBrowser){
    require('jquery-loaded');
    require('backbone.trackit');
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

  utils.stampit = require('stampit');

  if (isBrowser){
    var $ = require('jquery');
    utils.dom = $;
    utils.domready = $;
    utils.ajax = $.ajax;
    utils.http = $.ajax;
    utils.key = require('keymaster');
    utils.Plan = require('plan');

    require('gplaces').http( function( input, callback ){
      $.getJSON( '/api/places?input=' + input )
        .error( callback )
        .success( callback.bind( null, null ) );
    });
  }

  utils.async = async;
  utils.validator = amanda('json');
  utils.Math = require('./math');
  utils.overload = require('leFunc');

  utils.Backbone    = Backbone;
  utils.Events      = Backbone.Events;
  utils.Model       = Backbone.Model;
  utils.Router      = Backbone.Router;
  utils.History     = Backbone.History;
  utils.View        = Backbone.View;

  utils.Collection  = Backbone.Collection.extend({
    createModel: function( attr, options ){
      return this._prepareModel( attr, options );
    }

  , del: function( id, options ){
      return (
        this.get( id ) || this.createModel( typeof id !== 'object' ? { id: id } : id )
      ).destroy( options );
    }

  , toJSON: function( options ){
      return utils.invoke( this.models, 'toJSON', options );
    }
  });

  utils.Model = Backbone.Model.extend({
    toJSON: function( options ){
      options = options || {};
      return utils.extend( {}, this.attributes , options.cid ? { cid: this.cid } : null );
    },

    schema: {
      type: 'object',
      properties: {}
    },

    validator: amanda('json'),

    validate: function(attrs, options) {
      return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, function(err) { return err; });
    }
  });

  utils.startHistory = function(){
    utils.history = Backbone.history;
    utils.history.start();
    utils.navigate = function(){ utils.history.navigate.apply(utils.history, arguments); };
  };

  /**
   * Throws an error if an object is missing a property
   * @param  {Object} obj        Object in question
   * @param  {Array}  properties Array of properties required
   */
  utils.enforceRequired = function( obj, properties ){
    if ( !_.isObject( obj ) ){
      throw new Error('Invalid first parameter');
    }

    if ( !_.isArray( properties ) ){
      throw new Error('Invalid second parameter');
    }

    for ( var i = 0; i < properties.length; i++ ){
      if ( !(properties[i] in obj) ){
        throw new Error('Missing required option: `' + properties[i] + '`');
      }
    }
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
