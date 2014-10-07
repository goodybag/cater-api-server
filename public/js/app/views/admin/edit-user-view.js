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
      var prop = $changed.attr('name');
      var type = $changed.data('type');
      var val;

      // Handle various input data-types
      if ( type === 'list' ) {
        var $checkboxes = this.$el.find('[name="' + prop + '"]:checked');
        val = $checkboxes.map( function() {
          return $(this).val();
        }).get();
      } else {
        val = $changed.val();
      }

      // Update model
      this.model.set(prop, val);
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
