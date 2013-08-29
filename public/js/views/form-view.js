var FormView = Backbone.View.extend({
  getDiff: function() {
    var diff = {};

    for (var key in this.fieldMap) {
      var getter = this.fieldGetters[key];
      var val = getter ? getter.apply(this) : this.$el.find(this.fieldMap[key]).val().trim() || null;
      if (!_.isEqual(val, this.model.get(key)))
        diff[key] = val;
    }

    return _.size(diff) > 0 ? diff : null;
  },

  fieldGetters: {},

  fieldMap: {},

  clearErrors: function() {
    this.$el.find('.form-control').parent().removeClass('has-error');
  },

  displayErrors: function() {
    var badFields =  _.uniq(_.pluck(_.pick(this.model.validationError, _.range(this.model.validationError.length)), 'property'));
    var selector = _.values(_.pick(this.fieldMap, badFields)).join(', ');
    this.$el.find(selector).parent().addClass('has-error');
  },

  onChange: function(e) {
    var diff = this.getDiff();
    this.$el.find(this.submitSelector).toggleClass('hide', !diff);
    return diff;
  },

  onSave: function(e) {
    e.preventDefault();
    this.clearErrors();
    var view = this;
    var sent = this.model.save(this.getDiff() || {}, {
      patch: true,
      wait: true,
      singleError: false,
      success: function(model, response, options) {
        view.$el.find(this.submitSelector).addClass('hide');
      }
    });

    if (!sent) this.displayErrors();
  }
}, {
  intGetter: function(field) {
    var val = this.$el.find(this.fieldMap[field]).val().trim();
    return val ? parseInt(val) : null;
  },
  floatGetter: function(field) {
    var val = this.$el.find(this.fieldMap[field]).val().trim();
    return val ? parseFloat(val) : null;
  }
});
