(function(factory){
  if ( typeof define === 'function' && define.amd ){
    // AMD. Register as an anonymous module.
    define( ['jquery'], factory );
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function( $ ){
  'use strict';

  var old = $.fn.gb_tablelist;

  var TableList = function(el, options) {
    this.$el = $(el);
    this.options = this.getOptions(options);

    this.initEvents();
    this.numSelected = this.getNumSelected();

    return this;
  };

  TableList.DEFAULTS = {

  };

  TableList.prototype.getDefaults = function() {
    return TableList.DEFAULTS;
  };

  TableList.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$el.data(), options);
    return options;
  };

  TableList.prototype.initEvents = function( first_argument ){
    this.$el.find('.list-header > .item-selector > input').change( this.onItemSelectorAllChange );
    this.$el.find('.list-items .item-selector > input').change( this.onItemSelectorChange );
  };

  TableList.prototype.state = function( state ){
    // body...
  };

  TableList.prototype.getNumSelected = function(){
    return this.$el.find('.list-items .item-selector > [checked]').length;
  };

  var Plugin = function( options ){
    return this.each(function() {
      var $this = $(this);
      var data = $this.data('gb.tablelist');

      if (!data) {
        data = new TableList(this, options);
        $this.data('gb.tablelist', data);
      }
    });
  };

  $.fn.gb_tablelist             = Plugin;
  $.fn.gb_tablelist.Constructor = TableList;

  // NO CONFLICT
  $.fn.gb_tablelist.noConflict = function() {
    $.fn.gb_tablelist = old;
    return this;
  };
}));
