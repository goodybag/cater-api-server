var FormView = Backbone.View.extend({
  getDiff: function() {
    var diff = {};

    for (var key in this.fieldMap) {
      var getter = this.fieldGetters[key];
      var val = getter ? getter.apply(this) : this.$el.find(this.fieldMap[key]).val().trim() || null;
      if (val != this.model.get(key))
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
  }
});
