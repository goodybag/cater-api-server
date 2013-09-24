(function(exports){
  var editItemOptionsTmpl = Handlebars.partials.edit_item_options;
console.log(editItemOptionsTmpl)
  var EditItemView = exports.EditItemView = FormView.extend({
    tagName: 'tr',

    template: Handlebars.partials.edit_item_row,

    submitSelector: '.item-save',

    events: {
      'click .item-remove': 'onItemRemove',
      'click .item-save': 'onSave',
      'click .item-edit-options': 'onEditOptionsClick',
      'keyup .form-control': 'onChange',
      'change .form-control': 'onChange'
    },

    initialize: function(options) {
      if (this.model) this.id = 'edit-item-' + this.model.id;
      if (this.$el) this.$el.attr('id', this.id);
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      if (this.model.isNew() || this.getDiff())
        this.$el.find('.item-save').removeClass('hide');
      return this;
    },

    fieldGetters: {
      price: function() {
        var val = this.$el.find(this.fieldMap.price).val().trim();
        return val ? Math.round(parseFloat(val) * 100) : null;
      },
      order: function() {
        var val = this.$el.find(this.fieldMap.order).val().trim();
        return val ? parseInt(val) : null;
      },
      feeds_min: function() {
        var val = this.$el.find(this.fieldMap.feeds_min).val().trim();
        return val ? parseInt(val) : null;
      },
      feeds_max: function() {
        var val = this.$el.find(this.fieldMap.feeds_max).val().trim();
        return val ? parseInt(val) : null;
      }
    },

    fieldMap: {
      order: '.item-order',
      name: '.item-name',
      price: '.item-price',
      feeds_min: '.item-feeds-min',
      feeds_max: '.item-feeds-max',
      description: '.item-description'
    },

    attach: function() {
      this.$el.hide();
      this.delegateEvents();
      this.options.category.$el.find('tbody').append(this.$el);
      this.$el.fadeIn();
    },

    toggleEditOptions: function(){
      // If edit options was previously open, close
      if ( this.$el.find('+ tr.edit-options').length ){
        this.$el.find('.item-edit-options').text('Edit Options');
        return this.$el.find('+ tr.edit-options').remove();
      }

      // Insert the edit options row after this table row
      var $el = $( editItemOptionsTmpl({ model: this.model.toJSON() }) );
      this.$el.after( $el );

      this.$el.find('.item-edit-options').text('Close Options');
    },

    onItemRemove: function(e) {
      var view = this;
      this.model.destroy({
        success: function(model, response, options) {
          view.$el.fadeOut({complete: _.bind(view.remove, view)});
        }
      });
    },

    onEditOptionsClick: function(e){
      e.preventDefault();

      this.toggleEditOptions();
    }
  });
})(window);

