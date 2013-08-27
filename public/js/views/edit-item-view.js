var EditItemView = Backbone.View.extend({
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

  attach: function() {
    this.$el.hide();
    $(this.options.tbody).append(this.$el)
    this.$el.fadeIn();
  }

});
