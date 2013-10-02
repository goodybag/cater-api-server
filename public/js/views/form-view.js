var FormView = Backbone.View.extend({
  getDiff: function() {
    var diff = {};

    for (var key in this.fieldMap) {
      var getter = this.fieldGetters[key];
      var val = getter ? getter.apply(this) : (this.$el.find(this.fieldMap[key]).val()||'').trim() || null;
      if (!(val == null && this.model.get(key) == null) && !_.isEqual(val, this.model.get(key)))
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
    var badFields =  _.uniq(_.invoke(_.pluck(_.pick(this.model.validationError,
                                                    _.range(this.model.validationError.length)), 'property'),
                                     'replace', /\[\d+\]$/, ''));
    var selector = _.values(_.pick(this.fieldMap, badFields)).join(', ');
    this.$el.find(selector).parent().removeClass('has-success').addClass('has-error');
  },

  onChange: function(e) {
    var diff = this.getDiff();
    this.$el.find(this.submitSelector).toggleClass('hide', !diff);
    return diff;
  },

  onSave: function(e, callback) {
    if (callback === undefined && _.isFunction(e)) {
      callback = e;
      e = undefined;
    }
    if (e && _.isFunction(e.preventDefault)) e.preventDefault();
    callback = _.isFunction(callback) ? callback : function() {};
    this.clearErrors();
    var diff = this.getDiff();
    if (!diff) return callback.call(this);
    var view = this;

    // Do a set before save so if the save fails, it does not revert the changes on the model
    // and the is_bad_* properties get properly set
    this.model.set(diff);

    var sent = this.model.save(null, {
      patch: true,
      wait: true,
      singleError: false,
      success: function(model, response, options) {
        view.$el.find(view.submitSelector).addClass('hide');
        callback.call(view, null, response);
      },
      error: function(model, response, options) {
        callback.call(view, response);
      }
    });

    if (!sent) {
      this.displayErrors();
      callback.call(this, this.model.validationError);
    }
  }
}, {
  intGetter: function(field) {
    var val = (this.$el.find(this.fieldMap[field]).val()||'').trim();
    return val ? parseInt(val) : null;
  },
  floatGetter: function(field) {
    var val = (this.$el.find(this.fieldMap[field]).val()||'').trim();
    return val ? parseFloat(val) : null;
  }
});
