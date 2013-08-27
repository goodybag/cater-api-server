var EditItemView = View.extend({
  tagName: 'tr',

  template: Handlebars.partials.edit_item_row,

  initialize: function(options) {
    if (this.model) this.id = 'edit-item-' + this.model.id;
    if (this.$el) this.$el.attr('id', this.id);
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },

  getters: {
    price: function() {
      var val = this.$el.find(this.fieldMap.price).val().trim();
      return val ? parseInt(val / 100) : null;
    }
  }

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
  }

});
