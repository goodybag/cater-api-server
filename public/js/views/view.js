var View = Backbone.View.extend({
  getDiff: function() {
    var diff = {};

    for (var key in this.fieldMap) {
      var getter = this.fieldGetters[key];
      var val = getter ? getter.apply(this) : this.$el.find(this.fieldMap[key]).val().trim() || null;
      if (val != this.model.get(key))
        diff[key] = val;
    }

    return _.size(diff) > 0 ? diff : null;
  }
});
