/**
 * Admin Item Form View
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var utils     = require('utils');
  var config    = require('config');
  var spinner   = require('spinner');

  return module.exports = utils.View.extend({
    events: {
      'click .btn-delete':  'onBtnDeleteClick'
    }

  , initialize: function( options ){
      if ( !(options.collection instanceof utils.Collection) ){
        throw new Error('Missing required property: `collection`');
      }

      this.collection = options.collection;

      return this;
    }

  , onBtnDeleteClick: function( e ){
      var this_ = this;

      e.preventDefault();
      spinner.start();

      var model = this.collection.createModel({ id: $( e.currentTarget ).data('id') });

      model.destroy().done( function(){
        spinner.stop();
        this_.trigger( 'item:saved', model, this_ );
        $( e.currentTarget ).parents('tr').eq(0).remove();
      }).fail( function( xhr, status, error ){
        spinner.stop();
        notify.error( error );
      });
    }
  });
});