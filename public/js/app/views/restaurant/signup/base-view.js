define(function (require, exports, module) {
  var utils = require('utils');
  var FormView = require('../../form-view');
  var spinner = require('spinner');
  var Handlebars = require('handlebars');
  var cookie = require('../../../../cookie');

  return module.exports = FormView.extend({

    displayErrors: function( errors ){
      // Just in case!
      spinner.stop();

      var this_ = this;
      var error, $el, $parent;
      var template = Handlebars.partials.alert_error;

       var css = {
        position: 'absolute'
      , top: '-9px'
      };

      for ( var i = 0, l = errors.length; i < l; ++i ){
        error = errors[i];

        $el = $( template( error ) );
        $el.css( css );

        var selector = error.property ? this.fieldMap[error.property] : error.selector;
        $parent = this.$el.find( selector ).parents('.form-group').eq(0);

        $parent.prepend( $el );
        $parent.addClass('has-error');

        $el.css( 'right', 0 - $el[0].offsetWidth );
      }

      // Scroll to the first error
      $el = this.$el.find('.has-error');

      if ( $el.length ){
        $('html,body').animate({ scrollTop: $el.eq(0).offset().top - 100 });
      }
    }

  , clearErrors: function() {
      this.$el.find('.has-error').removeClass('has-error');
      this.$el.find('.alert').addClass('hide');
    }

  });
});
