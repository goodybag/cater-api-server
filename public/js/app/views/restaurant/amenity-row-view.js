define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');
  var Amenity = require('app/models/amenity');
  var spinner = require('spinner');
  var ItemForm = require('app/views/admin/item-form');

  var AmenityRowView = module.exports = ItemForm.extend({
    template: Handlebars.partials.amenity_row,

    tagName: 'tr',

    events: {
      'click .js-btn-edit':      'onClickEdit'
    , 'click .js-btn-save':      'onClickSave'
    , 'click .js-btn-remove':    'onClickRemove'
    },

    onClickEdit: function(e){
      e.preventDefault();
      this.toggleEditMode();
    },

    onClickSave: function(e){
      e.preventDefault();
      spinner.start();
      var sent = this.options.amenity.save(this.getViewState(), {
        success: function() {
          spinner.stop();
        }
      , error: function() {
          spinner.stop();
        }
      , patch: true
      });
      this.toggleEditMode();
    },

    onClickRemove: function(e) {
      spinner.start();
      this.options.amenity.destroy({ 
        success: function() {
          spinner.stop();
        }
      , error: function() {
          spinner.stop();
        }
      });
      this.remove();
      return this;
    },

    toggleEditMode: function() {
      this.$el.find('.js-read, .js-edit').toggleClass('hide');
      return this;
    },

    onChange: function(model) {
      var this_ = this;
      Object.keys(model.changed).forEach(function updateEachAttr(key) {
        var $el = this_.$el.find('.js-'+key);
        var output = model.changed[key];
        switch ( $el.attr('type') ){
          case 'number':
            output = Handlebars.helpers.dollars(output);
            break;
          default:
            break;
        }
        $el.text(output);
        $el.attr('value', output);
      });
    },

    initialize: function() {
      this.amenity = this.amenity || new Amenity();
      this.options.amenity.on('change', this.onChange.bind(this));
    },

    getViewState: function() {
      // read the inputs off the dom
      return {
        name: this.$el.find('[name="name"]').val()
      , description: this.$el.find('[name="description"]').val()
      , price: Handlebars.helpers.pennies(this.$el.find('[name="price"]').val())
      };
    },

    render: function() {
      this.$el.html(this.template(this.options.amenity.toJSON()));
      return this;
    }
  });

  return AmenityRowView;
});
