define(function(require){
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var FormView2 = require('views/form-view-2');

  return FormView2.extend({
    tagName: 'form'

  , events: {
      'submit': 'onSubmit'
    }

  , errorTypeMessages: {
      required: 'Please enter a valid {noun}'
    }

  , schema: {
      type: 'object'
    , properties: {
        email: {
          type: 'string'
        , format: 'email'
        , minLength: 1
        , required: true
        }
      , password: {
          type: 'string'
        , minLength: 1
        , required: true
        }
      , password2: {
          type: 'string'
        , minLength: 1
        , required: true
        }
      , firstName: {
          type: ['string', 'null']
        , required: false
        }
      , lastName: {
          type: ['string', 'null']
        , required: false
        }
      , organization: {
          type: ['string', 'null']
        , required: false
        }
      }
    }

  , fieldNounMap: {
      firstName:  'first name'
    , lastName:   'last name'
    }

  , getFormData: function(){
      return {
        email:          this.$el.find('[name="email"]').val()
      , password:       this.$el.find('[name="password"]').val()
      , password2:      this.$el.find('[name="password2"]').val()
      , firstName:      this.$el.find('[name="firstName"]').val()
      , lastName:       this.$el.find('[name="lastName"]').val()
      , organization:   this.$el.find('[name="organization"]').val()
      };
    }

  , validate: function(){
      var data = this.getFormData();
      var options = { singleError: false };

      var errors = utils.validator.validate( data, this.schema, options, function( error ){
        return error;
      }) || [];

      if ( !errors.length )
      if ( data.password !== data.password2 ){
        errors.push({
          validatorName: 'passwordMatch'
        });
      }

      return errors;
    }

  , onSubmit: function( e ){
      var errors = this.validate();

      if ( errors.length ){
        e.preventDefault();
        return this.displayErrors( errors, this.$el.find('.errors'), this );
      } else {
        mixpanel.track('Sign Up');
      }
    }
  });
});