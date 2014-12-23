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
      'submit':             'onSubmit'
    , 'click .btn-delete':  'onBtnDeleteClick'
    }

  , onSubmit: function( e ){
      var this_ = this;

      e.preventDefault();
      spinner.start();

      var redirect = this.model.isNew();
      this.model.save( this.getModelData(), {
        patch: this.options.patch || false
      , success: function(){
          spinner.stop();
          venter.trigger( 'item:saved', this_.model );
          this_.trigger( 'item:saved', this_.model, this_ );
          if (redirect && this_.redirect) {
            this_.redirect();
          }
        }

      , error: function( error ){
          spinner.stop();
          venter.trigger( 'item:error', error, this_.model );
          this_.trigger( 'item:error', error, this_.model, this_ );
          notify.error( error );
        }
      });
    }

  , onBtnDeleteClick: function( e ){
      var this_ = this;

      e.preventDefault();
      spinner.start();

      this.model.destroy().done( function(){
        spinner.stop();
        venter.trigger( 'item:destroyed', this_.model );
        this_.trigger( 'item:destroyed', this_.model, this_ );
      }).fail( function( xhr, status, error ){
        spinner.stop();
        notify.error( error );
      });
    }
  });
});
