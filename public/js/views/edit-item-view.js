var EditItemView = View.extend({
  tagName: 'tr',

  template: Handlebars.partials.edit_item_row,

  events: {
    'click .item-remove': 'onItemRemove',
    'click .item-save': 'onSave'
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
      return val ? parseInt(val / 100) : null;
    }
  },

  fieldMap: {
    order: '.item-order',
    name: '.item-name',
    price: '.item-price',
    feeds_min: '.item-feeds-min',
    feeds_max: '.item-feeds-max'
  },

  attach: function() {
    this.$el.hide();
    this.options.category.$el.find('tbody').append(this.$el);
    this.$el.fadeIn();
  },

  onItemRemove: function(e) {
    var view = this;
    this.model.destroy({
      success: function(model, response, options) {
        view.$el.fadeOut({complete: _.bind(view.remove, view)});
      }
    });
  },

  onSave: function(e) {
    this.model.save(this.getDiff());
  }
});
