define(function(require){
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return utils.View.extend({
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
      , password:       this.$el.find('[name="password"]').eq(0).val()
      , password2:      this.$el.find('[name="password"]').eq(1).val()
      , firstName:      this.$el.find('[name="firstName"]').val()
      , lastName:       this.$el.find('[name="lastName"]').val()
      , organization:   this.$el.find('[name="organization"]').val()
      };
    }

  , validate: function(){
      return utils.validator.validate( this.getFormData(), this.schema, function( error ){
        console.log(error);
        return error;
      }) || [];
    }

  , onSubmit: function( e ){
        e.preventDefault();
      var errors = this.validate();

      if ( errors.length ){
        e.preventDefault();
        return this.displayErrors2( errors, this );
      }
    }
  });
});