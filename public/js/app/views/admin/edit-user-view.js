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
    twoway: {
      is_tax_exempt: true
    }

  , initialize: function( options ){
      ItemForm.prototype.initialize.call( this, options );

      this.model.on( 'change:is_tax_exempt', this.onTaxExemptChange.bind( this ) );
    }

  , redirect: function() {
      window.location = '/admin/users/' + this.model.get('id');
    }

  , onTaxExemptChange: function( model ){
      this.$el
        .find('[name="tax_exempt_id"]')
        .val('')
        .parents('fieldset')
        .toggleClass( 'hide', !model.get('is_tax_exempt') )
    }
  });
});
