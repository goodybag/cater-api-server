/**
 * Order Driver Requests
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    module.exports = factory(require, exports, module);
  };
}


define(function(require){
  var utils = require('utils');

  return utils.View.extend({
    events: {
      'click .create-btn': 'onCreateBtnClick'
    }

  , initialize: function(){
      this.$newRequest = this.$el.find('tr.new-request');
      this.$createBtn = this.$el.find('.create-btn');
    }

  , showNewForm: function(){
      this.$newRequest.removeClass('hide');
      this.$createBtn.addClass('hide');
    }

  , hideNewForm: function(){
      this.$newRequest.addClass('hide');
      this.$createBtn.removeClass('hide');
    }

  , addNew: function(){
      var $tr = $( Hbs.driver_requests_table_row() );

      this.$el.find('tbody').prepend( $tr );

      return this;
    }

  , onCreateBtnClick: function( e ){
      this.showNewForm();
    }
  });
});