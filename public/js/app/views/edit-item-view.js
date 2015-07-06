define(function(require, exports, module) {
  var FormView = require('./form-view');
  var EditOptionsView = require('./edit-options-view')
  var Item = require('../models/item');
  var Handlebars = require('handlebars');

  var EditItemView = FormView.extend({
    tagName: 'div',

    className: 'row',

    template: Handlebars.partials.edit_item_row,

    submitSelector: '.item-save',

    events: {
      'click .item-copy': 'onItemCopy',
      'click .item-remove': 'onItemRemove',
      'click .item-save': 'onSave',
      'click .item-edit-options': 'onEditOptionsClick',
      'click .item-add-photo': 'onAddPhotoClick',
      'keyup .form-control': 'onChange',
      'change .form-control, .edit-item-tags': 'onChange'
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
      },
      tags: function() {
        return _.pluck(this.$el.find(this.fieldMap.tags + ':checked'), 'value');
      },
      is_hidden: function() {
        return this.$el.find(this.fieldMap.is_hidden).is(':checked');
      },
      hide_pricing: function() {
        return this.$el.find(this.fieldMap.hide_pricing).is(':checked');
      }
    },

    fieldMap: {
      order: '.item-order',
      name: '.item-name',
      price: '.item-price',
      feeds_min: '.item-feeds-min',
      feeds_max: '.item-feeds-max',
      min_qty: '.item-min-qty',
      description: '.item-description',
      tags: '.edit-item-tags input',
      is_hidden: '.item-hide',
      hide_pricing: '.item-hide-pricing',
      photo_url: '.item-photo'
    },

    /**
     * Attach after element or append to the table body
     * @param  {jQuery Element} element - optional
     */
    attach: function(element) {
      this.$el.hide();
      this.delegateEvents();
      (element) ? element.after(this.$el) : this.options.category.$el.find('.items-list').append(this.$el);
      this.$el.stop(true, true).fadeIn();
    },

    toggleEditOptions: function(){
      // Edit Options is currently open
      if ( this.editOptions ){
        this.editOptions.remove();
        delete this.editOptions;
        this.$el.find('.item-edit-options').text('+ Edit Options');
        return this;
      }

      // Create new edit options view, append after this element
      this.editOptions = new EditOptionsView({ model: this.model });
      this.editOptions.render();

      this.editOptions.on( 'close', this.toggleEditOptions, this );

      this.$el.after( this.editOptions.$el );

      this.$el.find('.item-edit-options').text('- Close Options');

      return this;
    },

    onItemCopy: function(e) {
      var copy = this.model.omit(['id', 'created_at']);

      var itemModel = new Item(copy, {category: this.model.category});
      itemModel.set('order', itemModel.get('order') + 1);
      var itemView = new EditItemView({model: itemModel, category: this.options.category});

      itemModel.category.items.add(itemModel, {sort: false});
      this.options.category.items.push(itemView);

      itemView.render().attach(this.$el);
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
    },

    onAddPhotoClick: function (e) {
      e.preventDefault();
      if (filepicker) {
        filepicker.pick(function (blob) {
          this.$el.find(this.fieldMap.photo_url).val(blob.url);
          this.$el.find('.img-item-photo').attr('src', blob.url);
          this.$el.find('.item-save').removeClass('hide');
        }.bind(this));
      }
    }
  });

  module.exports = EditItemView;
});
