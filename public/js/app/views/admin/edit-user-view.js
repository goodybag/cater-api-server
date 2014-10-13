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
  var ItemForm  = require('app/views/admin/item-form');

  return module.exports = ItemForm.extend({
    redirect: function() {
      window.location = '/admin/users/' + this.model.get('id');
    }
  });
  // return module.exports = utils.View.extend({
  //   events: {
  //     'submit':           'onSubmit'
  //   , 'change input':     'onChange'
  //   }
  //
  // // , template: Hbs.partials['matrix_editor']
  //
  // , initialize: function( options ){
  //     this.model = options.model || new User();
  //     return this;
  //   }
  //
  // , render: function(){
  //     // this.$el.html( this.template({
  //     //   set:      this.set
  //     // , values:   this.values
  //     // , options:  this.options
  //     // }));
  //     //
  //     // this.$trs = this.$el.find('tr');
  //
  //     return this
  //   }
  // , onChange: function(e) {
  //     var $changed = this.$(e.currentTarget);
  //     var prop = $changed.attr('name');
  //     var dataType = $changed.data('type');
  //     var attrType = $changed.attr('type');
  //     var val;
  //
  //     // Handle various input data-types
  //     if ( dataType === 'list' ) {
  //       var $checkboxes = this.$el.find('[name="' + prop + '"]:checked');
  //       val = $checkboxes.map( function() {
  //         return $(this).val();
  //       }).get();
  //     } else if ( attrType === 'checkbox' ) {
  //       val = $changed.is(':checked');
  //     } else {
  //       val = $changed.val();
  //     }
  //
  //     // Update model
  //     this.model.set(prop, val);
  //     console.log(this.model.changedAttributes());
  //   }
  //
  // , onSubmit: function(e) {
  //     e.preventDefault();
  //     spinner.start();
  //     this.model.save(this.model.changedAttributes(), {
  //       patch: true
  //     , success: this.onSuccess
  //     , error: this.onError
  //     });
  //   }
  //
  // , onSuccess: function() {
  //     spinner.stop();
  //     console.log('success');
  //   }
  //
  // , onError: function() {
  //     spinner.stop();
  //     console.log('error');
  //   }
  // });
});
