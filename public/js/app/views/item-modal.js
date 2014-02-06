define(function(require, exports, module) {
  var Handlebars = require('handlebars');
  var helpers = require('hb-helpers');

  var Backbone = require('backbone');
  var OrderItem = require('../models/order-item');

  return module.exports = Backbone.View.extend({
    events: {
      'submit .modal-item-form': 'submit'
    , 'click .btn-item-remove':  'onItemRemoveClick'
    },

    // template: require('hb!/partials/item-modal'),
    template: Handlebars.partials.item_modal,

    render: function() {
      var context = {
        item:     this.model.toJSON(),
        order:    this.options.orderModel.toJSON(),
        inOrder:  this.model instanceof OrderItem
      };

      this.$el.html( this.template( context ) );

      this.$el.find('.tag-tooltip').tooltip();
    },

    provideModel: function(model) {
      this.stopListening(this.model);
      this.model = model;
      // This is where any model event listeners would go
      this.render();
      return this;
    },

    show: function() {
      this.$el.modal('show');
    },

    hide: function() {
      this.$el.modal('hide');
    },

    submit: function(e) {
      e.preventDefault();
      var this_ = this;

      if (this.options.loginNeeded) {
        this.$el.find('.login-needed-modal').modal('show');

        return;
      }

      if ( !this.options.orderModel.isFulfillableOrder() ) {
        return this.options.orderModal.show({
          success: function(model, response, options) {
            model.trigger('change:orderparams');
            this_.options.orderModal.hide();
            this_.submit(e);
          }
        , error: function(){
            alert('sorry we were unable to add item to order, please refresh page and try again');
          }
        , enforceRequired: false
        });
      }

      var orderItem = this.model instanceof OrderItem ? this.model : null;

      var data = {
        quantity:     parseInt( this.$el.find('.item-quantity').val() ),
        notes:        (this.$el.find('.form-group-item-notes textarea').val()||'').trim() || null,
        recipient:    (this.$el.find('.form-group-item-recipient input').val()||'') || null
      };

      if (data.quantity <= 0) {
        if (orderItem) orderItem.destroy();
        return this.hide();
      }

      // Get checkbox/radio option states
      data.options_sets = _( this.model.get('options_sets') ).map( function( set ) {
        return _.extend({}, set, {
          options: _( set.options ).map( function( option ) {
            var state = this_.$el.find( '#item-option-' + option.id ).is(':checked');
            return _.extend({}, _.omit(option, 'default_state'), {state: state});
          })
        });
      });

      this.clearErrors();

      if (orderItem){
        orderItem.save(data, {
          wait: true,
          success: function(){
            this_.trigger('submit:success');
          }
        });
      } else {
        orderItem = this.options.orderItems.create(_.extend( { item_id: this.model.attributes.id }, data ), { wait: true });
      }

      orderItem.validationError ? this.displayErrors( orderItem.validationError ) : this.hide();
    },

    displayErrors: function( errors ){
      var this_       = this;
      var $errors     = this.$el.find('.errors');
      var $errorTmpl  = $errors.find('.alert-generic');

      _( errors ).forEach( function( error ){
        var $error = $errorTmpl.clone().html( error.message ).removeClass('hide');

        if ( error.optionSetId ){
          $error.addClass('error-options-set-required');
          this_.$el.find('[data-options-set-id="' + error.optionSetId + '"]').before( $error );
        } else {
          $errors.append( $error );
        }
      });

      return this;
    },

    clearErrors: function(){
      this.$el.find('.alert').addClass('hide');
      return this;
    },

    onItemRemoveClick: function(e) {
      e.preventDefault();

      if ( this.model instanceof OrderItem ){
        this.model.destroy();
      }

      this.hide();
    }
  });
});