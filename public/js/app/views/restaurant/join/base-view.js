define(function (require, exports, module) {
  var utils = require('utils');
  var FormView = require('../../form-view');
  var spinner = require('spinner');
  var Handlebars = require('handlebars');
  var cookie = require('../../../../cookie');

  return module.exports = FormView.extend({
    events: {
      'click .btn-continue': 'submit'
    }
  , initialize: function () {
      console.log('init base');

      //expose stuff for _dev_
      window.model = this.model;
      window.cookie = cookie;

      //restaurant signup view state
      this.cookieName = 'gb_rs';
      this.store = 'gb_restaurant';
      this.model.set(this.getLocalStorage());
    }

  , setLocalStorage: function ( json ) {
      if (typeof json === 'object') json = JSON.stringify(json);
      localStorage.setItem(this.store, json);
    }

  , getLocalStorage: function () {
      return JSON.parse(localStorage.getItem(this.store));
    }

  , setCookie: function ( value ) {
      cookie.setItem(this.cookieName, value);
    }

  , getCookie: function () {
      return cookie.getItem(this.cookieName);
    }

  , submit: function (e) { return false; }

  , displayErrors: function( errors ){
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

        $parent = this.$el.find(
          this.fieldMap[error.property]
        ).parents('.form-group').eq(0);

        $parent.prepend( $el );
        $parent.addClass('has-error');

        $el.css( 'right', 0 - $el[0].offsetWidth );
      }

      // Scroll to the first error
      $el = this.$el.find('.has-error');

      if ( $el.length ){
        $('html,body').animate({ scrollTop: $el.eq(0).offset().top - 20 });
      }
    }

  , clearErrors: function() {
      this.$el.find('.has-error').removeClass('has-error');
      this.$el.find('.alert').addClass('hide');
    }

  });
});
