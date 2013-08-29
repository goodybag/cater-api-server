var EditItemView = View.extend({
  tagName: 'tr',

  template: Handlebars.partials.edit_item_row,

  events: {
    'click .item-remove': 'onItemRemove',
    'click .item-save': 'onSave',
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
    this.options.category.$el.find('tbody').append(this.$el);
    this.$el.fadeIn();
  },

  onChange: function(e) {
    this.$el.find('.item-save').toggleClass('hide', !this.getDiff());
  },

  onItemRemove: function(e) {
    var view = this;
    this.model.destroy({
      success: function(model, response, options) {
        view.$el.fadeOut({complete: _.bind(view.remove, view)});
      }
    });
  },

  clearErrors: function() {
    this.$el.find('.form-control').parent().removeClass('has-error');
  },

  displayErrors: function() {
    var badFields =  _.uniq(_.pluck(_.pick(this.model.validationError, _.range(this.model.validationError.length)), 'property'));
    var selector = _.values(_.pick(this.fieldMap, badFields)).join(', ');
    this.$el.find(selector).parent().addClass('has-error');
  },

  onSave: function(e) {
    this.clearErrors();
    var view = this;
    var sent = this.model.save(this.getDiff(), {
      patch: true,
      singleError: false,
      success: function(model, response, options) {
        view.$el.find('.item-save').addClass('hide');
      }
    });

    if (!sent) this.displayErrors();
  }
});
