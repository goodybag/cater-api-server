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
  var AlertView = require('app/views/alert-view')
  var spinner   = require('spinner');
  var venter    = require('venter');
  var notify    = require('notify');

  return module.exports = FormView2.extend({
    events: {
      'submit':             'onSubmit'
    , 'click .btn-delete':  'onBtnDeleteClick'
    }

  , initialize: function( options ){
      this.options = utils.defaults( options || {}, {
        alert: true
      , alertContainerSelector: '> .alert-container'
      , successTmpl: function( model ){
          return 'Success!'
        }

      , errorTmpl: function( error, model ){
          return error.message || 'Error!';
        }
      });
      this.alertView = new AlertView({
        el: this.$el.find( this.options.alertContainerSelector )
      });

      return FormView2.prototype.initialize.apply( this, arguments );
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

          if ( this_.options.alert ){
            this_.alertView.show(({
              type: 'success'
            , message: this_.options.successTmpl( this_.model )
            }));
          }

          if (redirect && this_.redirect) {
            this_.redirect();
          }
        }

      , error: function( model, error ){
          error = error && error.responseJSON ? error.responseJSON.error : error;

          spinner.stop();
          venter.trigger( 'item:error', error, this_.model );
          this_.trigger( 'item:error', error, this_.model, this_ );
          notify.error( error );

          if ( this_.options.alert ){
            this_.alertView.show(({
              type: 'error'
            , message: this_.options.errorTmpl( error, this_.model )
            }));
          }
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
