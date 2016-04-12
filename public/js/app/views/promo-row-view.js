define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var FormView = require('app/views/form-view-2');
  var api = require('api');
  var notify = require('notify');

  var PromoRowView = module.exports = FormView.extend({
    template: Handlebars.partials.promo_row,

    tagName: 'tr',

    events: {
      'click .js-btn-save':      'onBtnSaveClick'
    , 'click .js-btn-delete':    'onBtnDeleteClick'
    },

    onBtnSaveClick: function(e){
      e.preventDefault();

      this.model.save( this.getModelData(), function( error, result ) {
        if( error ) { notify.error(error); }
      });

    },

    onBtnDeleteClick: function(e) {
      e.preventDefault();

      this.model.destroy( this.model.get("promo_code"), function( error, result ) {
        if( error ) { notify.error(error); }
      });
    },

    initialize: function() {
      var this_ = this;

      this.model.on('item:created', function() {
        this_.render();
      });

      this.model.on('item:destroyed', function() {
        this_.remove();
      });
    },

    render: function() {
      this.$el.html(this.template({
        promo: this.model.toJSON(),
        user: this.options.user
      }));
      return this;
    }
  });

  return PromoRowView;
});
