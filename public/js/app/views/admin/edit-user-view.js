/**
 * Admin Panel - Edit user view
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var $         = require('jquery-loaded');
  var Hbs       = require('handlebars');
  var utils     = require('utils');
  var config    = require('config');
  var spinner   = require('spinner');
  var User      = require('app/models/user');
  var ItemForm  = require('app/views/admin/item-form');

  return module.exports = ItemForm.extend({
    redirect: function() {
      window.location = '/admin/users/' + this.model.get('id');
    }
  });
});
