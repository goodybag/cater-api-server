define(function(require, exports, module) {
  var _ = require('lodash');
  var helpers = require('./helpers');

  var utils = _.extend({}, _, helpers);

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

  return module.exports = utils;
});