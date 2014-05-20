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
  var FormView2 = require('app/views/form-view-2');
  var spinner   = require('spinner');
  var venter    = require('venter');
  var notify    = require('notify');

  return module.exports = FormView2.extend({
    events: {
      'submit':       'onSubmit'
    }

  , initialize: function( attr, options ){
      return this;
    }

  , onSubmit: function( e ){
      var this_ = this;

      e.preventDefault();

      spinner.start();

      this.model.save( this.getModelData(), {
        success: function(){
          spinner.stop();
          venter.trigger( 'item:saved', this_.model );
        }

      , error: function( error ){
          spinner.stop();
          notify.error( error );
        }
      });
    }
  });
});