var isBrowser = true;
if (typeof module === 'object' && typeof define !== 'function') {
  isBrowser = false;
  var define = function(factory) {
    return module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var _ = require('lodash');
  var helpers = require('./helpers');

  var Backbone = {};
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

  utils.Backbone    = Backbone;
  utils.Events      = Backbone.Events;
  utils.Model       = Backbone.Model;
  utils.View        = Backbone.View;
  utils.Collection  = Backbone.Collection;
  utils.Router      = Backbone.Router;
  utils.History     = Backbone.History;

  utils.startHistory = function(){
    console.log('starting history');
    utils.history = Backbone.history;
    utils.history.start();
    utils.navigate = function(){ utils.history.navigate.apply(utils.history, arguments); };
  };

  return module.exports = utils;
});