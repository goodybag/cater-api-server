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

    this.init();

    return this;
  };

  TableList.DEFAULTS = {

  };

  TableList.prototype.init = function(){
    this.$checkboxes = this.$el.find('.list-items [type="checkbox"]');
    this.initEvents();
    this.numSelected = this.getNumSelected();
  };

  TableList.prototype.getDefaults = function() {
    return TableList.DEFAULTS;
  };

  TableList.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$el.data(), options);
    return options;
  };

  TableList.prototype.initEvents = function( first_argument ){
    this.$el.find('.list-header > .item-selector > input').change( this.onItemSelectorAllChange.bind( this ) );
    this.$el.find('.list-items .item-selector > input').change( this.onItemSelectorChange.bind( this ) );
  };

  TableList.prototype.getNumSelected = function(){
    return this.$checkboxes.filter(':checked').length;
  };

  TableList.prototype.checkNumSelected = function(){
    this.numSelected = this.getNumSelected();

    if ( this.numSelected === 0 ){
      this.$el.removeClass('some-checked');
    } else {
      this.$el.addClass('some-checked');
    }

    return this;
  };

  TableList.prototype.selectAll = function(){
    this.$checkboxes.each( function(){
      this.checked = true;
    });

    this.checkNumSelected();

    return this;
  };

  TableList.prototype.deselectAll = function(){
    this.$checkboxes.each( function(){
      this.checked = false;
    });

    this.checkNumSelected();

    return this;
  };

  // Event Handlers
  TableList.prototype.onItemSelectorAllChange = function( e ){
    if ( e.target.checked ){
      this.selectAll();
    } else {
      this.deselectAll();
    }
  };

  TableList.prototype.onItemSelectorChange = function( e ){
    this.checkNumSelected();
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
