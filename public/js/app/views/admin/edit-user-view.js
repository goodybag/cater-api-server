/**
 * Matrix Editor
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var $         = require('jquery-loaded');
  var Hbs       = require('handlebars');
  var utils     = require('utils');
  var config    = require('config');
  var spinner   = require('spinner');
  var User      = require('app/models/user');

  return module.exports = utils.View.extend({
    events: {
      'submit':           'onSubmit'
    , 'change input':     'onChange'
    }

  // , template: Hbs.partials['matrix_editor']

  , initialize: function( options ){
      this.model = options.model || new User();
      return this;
    }

  , render: function(){
      // this.$el.html( this.template({
      //   set:      this.set
      // , values:   this.values
      // , options:  this.options
      // }));
      //
      // this.$trs = this.$el.find('tr');

      return this
    }
  , onChange: function(e) {
      var $changed = this.$(e.currentTarget);
      var val = $changed.val();
      var prop = $changed.attr('name');
      this.model.set(prop, val);
      console.log(this.model.changedAttributes());
    }

  , onSubmit: function(e) {
      e.preventDefault();
      console.log('submit');
      this.model.save(this.model.changedAttributes(), {
        patch: true
      , success: this.onSuccess
      , error: this.onError
      });
    }
  , onSuccess: function() {
      console.log('success');
    }

  , onError: function() {
      console.log('error');
    }
  });
});
