define(function(require, exports, module) {
  var Handlebars = require('handlebars');
  var helpers = require('hb-helpers');
  var config = require('config');
  var Backbone = require('backbone');
  var OrderItem = require('../models/order-item');

  return module.exports = Backbone.View.extend({
    events: {
      'submit .modal-item-form': 'submit'
    , 'click .btn-item-remove':  'onItemRemoveClick'
    , 'click .checkbox': 'onItemChangeClick'
    },

    // template: require('hb!/partials/item-modal'),
    template: Handlebars.partials.item_modal,

    render: function() {
      var order = this.options.orderModel.toJSON();

      var context = {
        item:     this.model.toJSON(),
        order:    order,
        config:   config,
        inOrder:  this.model instanceof OrderItem,
        editable: this.options.isAdmin || order.editable
      };

      this.$el.html( this.template( context ) );

      this.$el.find('[data-toggle="tooltip"]').tooltip();
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

    showOrderModal: function(e) {
      var this_ = this;
      return this.options.orderModal.show({
        success: function(model) {
          this_.options.orderModal.hide();
          this_.submit(e);
        }
      , error: function(){
          alert('Something went wrong, please refresh page and try again!');
        }
      , enforceRequired: false
      });
    },

    submit: function(e) {
      e.preventDefault();
      var this_ = this;
      var noOrder = !this.options.orderModel.id;
      var unfulfillable = !this.options.isAdmin && !this.options.orderModel.areParamsFulfillable();
      if ( noOrder || unfulfillable ) {
        return this.showOrderModal(e);
      }

      var orderItem = this.model instanceof OrderItem ? this.model : null;

      var data = {
        quantity:     parseInt( this.$el.find('.item-quantity').val() ),
        notes:        (this.$el.find('.form-group-item-notes textarea').val()||'').trim() || null,
        recipient:    (this.$el.find('.form-group-item-recipient input').val()||'') || null,
        edit_token:   this.options.orderModel.attributes.edit_token
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
          validate: !this.options.isAdmin,
          success: function(){
            this_.trigger('submit:success');
          }
        });
      } else {
        orderItem = this.options.orderItems.create(_.extend( {
          item_id: this.model.attributes.id
        , min_qty: this.model.attributes.min_qty
        }, data ), { wait: true });
      }

      orderItem.validationError ? this.displayErrors( orderItem.validationError ) : this.hide();
    },

    displayErrors: function( errors ){
      var this_       = this;
      var $errors     = this.$el.find('.errors');
      var $errorTmpl  = $errors.find('.alert-generic');

      _( errors ).forEach( function( error ){
        var $error = $errorTmpl.clone().removeClass('alert-generic').html( error.message ).removeClass('hide');

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

    validateOptionsMaximum: function(e) {
      // checks if maximum # of options have been exceeded
      var $optionsSet = $(e.target).closest('.item-options-fieldset');
      var optionsSetId = $optionsSet.data('options-set-id');
      var options_set = _.findWhere(this.model.get('options_sets'), {id: optionsSetId});
      var selectedCount = $optionsSet.find('input[type="checkbox"]:checked').length;

      if ( options_set.selected_max ) {
        if ( selectedCount >= options_set.selected_max ) {
          $optionsSet.find('input[type="checkbox"]:not(:checked)').prop('disabled', true);
        } else {
          $optionsSet.find('input[type="checkbox"]').prop('disabled', false);
        }
      }
    },

    onItemRemoveClick: function(e) {
      e.preventDefault();

      if ( this.model instanceof OrderItem ){
        this.model.destroy();
      }

      this.hide();
    },

    onItemChangeClick: function(e) {
      var this_ = this;
      this.validateOptionsMaximum.call(this, e);
    }
  });
});
