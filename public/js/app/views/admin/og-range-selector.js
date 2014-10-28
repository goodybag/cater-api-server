/**
 * Ol Greg Date Range Selector
 */

define(function(require){
  var utils = require('utils');

  return utils.View.extend({
    events: {
      'submit': 'onFormSubmit'
    }

  , initialize: function( options ){
      this.options = utils.defaults( options || {}, {
        validation: {
          date: /\d{4}\-\d{2}\-\d{2}/
        }
      });
    }

  , getValues: function(){
      return {
        from: this.$el.find('[name="from"]').val()
      , to:   this.$el.find('[name="to"]').val()
      };
    }

  , validate: function( range ){
      if ( !range ) range = this.getValues();

      if ( typeof range !== 'object' ){
        throw new Error('Invalid type for `range` parameter');
      }

      utils.enforceRequired( range, ['from', 'to'] );

      this.clearErrors();

      var errors = [];

      if ( !this.options.validation.date.test( range.from ) ){
        errors.push('from');
      }

      if ( !this.options.validation.date.test( range.to ) ){
        errors.push('to');
      }

      if ( errors.length ){
        var selectors = '[name="' + errors.join('"], [name="') + '"]';
        this.error( selectors, 'Enter a valid date range');
      }

      if ( new Date( range.from ) >= new Date( range.to ) ){
        this.error( '[name="to"]', 'To must be a greater date than From' );
      }
    }

  , clearErrors: function(){
      this.$el.find('.errors').addClass('hide');
      this.$el.find('.has-error').removeClass('has-error');
      return this;
    }

  , error: function( highlight, msg ){
      this.clearErrors();
      this.$el.find('.errors').removeClass('hide').html( msg );
      this.$el.find( highlight ).addClass('has-error');
    }

  , onFormSubmit: function( e ){
      e.preventDefault();

      var range = this.getValues();

      if ( this.validate( range ) ) return;

      this.emit( 'submit', range, this );
    }
  });
});