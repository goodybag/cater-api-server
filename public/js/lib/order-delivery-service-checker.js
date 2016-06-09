/**
 * Order delivery service criteria
 *
 * An array of functions of the following schema
 *
 * Boolean function( Object order ){}
 *
 * The function should describe a single criterion for whether
 * or not an order should be picked up by a delivery service.
 * Returns true for delivery service, false for no
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function( factory ){
    module.exports = factory( require, exports, module );
  };
}

define(function( require, exports, module ){
  var moment = require('moment-timezone');
  var utils = require('utils');

  var criteria = require('./order-delivery-service-criteria');

  exports = {
    criteria: []

    /**
     * Checks an order object for whether or not a delivery service
     * shoudl orderr
     * @param  {Object} order Order object
     * @return {Boolean}      Should use DS
     */
  , check: function( order ){
      var criteria = exports.criteria.filter( function( c ){
        return c.type === 'every';
      });

      var result = utils.every( criteria, function( criterion ){
        return criterion.fn( order );
      });

      if ( !result ) return false;

      criteria = exports.criteria.filter( function( c ){
        return c.type === 'some';
      });

      return utils.some( criteria, function( criterion ){
        return criterion.fn( order );
      });
    }

  , why: function( order ){
      var criteria = exports.criteria.filter( function( c ){
        return c.type === 'every';
      });

      var result = utils.every( criteria, function( criterion ){
        return criterion.fn( order );
      });

      if ( !result ) return [];

      return exports.criteria.filter( function( c ){
        return c.type === 'some' && c.fn( order );
      }).map( function( c ){
        return {
          type: c.type
        , name: c.name
        };
      });
    }

    /**
     * Adds a new criterion
     *
     * I think all of the properties in criterion are pretty
     * self-explanatory except maybe `type`.
     *
     * There are two valid types: ['every', 'some']
     *
     * Every `every` type needs to be true for the order to be
     * considered a DS order. Otherwise, it is not. Then, we check
     * for some true `some` criterion. If any one of those is true,
     * AND every `every` type is true, then it is a DS Order.
     *
     * @param {Object} criterion criterion object
     */
  , add: function( criterion ){
      utils.enforceRequired( criterion, [
        'name', 'fn'
      ]);

      criterion = utils.defaults( criterion, {
        requirements: []
      });

      // Simply return false if the required fields are not present
      criterion.fn = utils.wrap( criterion.fn, function( fn, order ){
        if ( !utils.hasPropsDeep( order, criterion.requirements ) ){
          return false;
        }

        return fn( order );
      });


      var existing = utils.findIndex( exports.criteria, function( c ){
        return c.name === criterion.name;
      });

      // Only allow a single criterion of a given name
      if ( existing > -1 ){
        exports.criteria[ existing ] = criterion;
      } else {
        exports.criteria.push( criterion );
      }
    }

    /**
     * Removes the criterion with a given name
     * @param  {String} name Name identifier
     * @return {Object}      Criterion removed
     */
  , remove: function( name ){
      var idx = utils.findIndex( exports.criteria, function( criterion ){
        return criterion.name === name;
      });

      if ( idx === -1 ) return;

      return exports.criteria.splice( idx, 1 )[0]
    }
  };

  utils.each( criteria, exports.add );

  return exports;
});
