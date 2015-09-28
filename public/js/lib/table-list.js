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
    this.$items = this.$el.find('.list-item');
    this.$checkboxes = this.$items.find('[type="checkbox"]');
    this.destroyEvents();
    this.initEvents();
    this.numSelected = this.getNumSelected();
  };

  TableList.prototype.append = function( model ){
    if ( typeof this.options.itemTemplate !== 'function' ){
      throw new Error('Must provide `itemTemplate` option');
    }

    this.$el.find('.list-items').append( this.options.itemTemplate( model ) );
    this.init();

    return this;
  };

  TableList.prototype.prepend = function( model ){
    if ( typeof this.options.itemTemplate !== 'function' ){
      throw new Error('Must provide `itemTemplate` option');
    }

    this.$el.find('.list-items').prepend( this.options.itemTemplate( model ) );
    this.init();

    return this;
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

  TableList.prototype.destroyEvents = function( first_argument ){
    this.$el.find('.list-header > .item-selector > input').off( 'change', this.onItemSelectorAllChange.bind( this ) );
    this.$el.find('.list-items .item-selector > input').off(  'change', this.onItemSelectorChange.bind( this ) );
  };

  TableList.prototype.getNumSelected = function(){
    return this.$checkboxes.filter(':checked').length;
  };

  TableList.prototype.checkNumSelected = function(){
    this.numSelected = this.getNumSelected();

    if ( this.numSelected === 0 ){
      this.$el.removeClass('some-selected');
    } else {
      this.$el.addClass('some-selected');
    }

    return this;
  };

  TableList.prototype.selectAll = function(){
    this.$checkboxes.each( function(){
      this.checked = true;
    });

    this.checkNumSelected();
    this.setItemStateSelected( this.$items );

    return this;
  };

  TableList.prototype.deselectAll = function(){
    this.$checkboxes.each( function(){
      this.checked = false;
    });

    this.checkNumSelected();
    this.setItemStateUnselected( this.$items );

    return this;
  };

  TableList.prototype.setItemStateSelected = function( $el ){
    $el.addClass('selected');
    return this;
  };

  TableList.prototype.setItemStateUnselected = function( $el ){
    $el.removeClass('selected');
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
    var $item = $( e.target ).closest('.list-item');

    this.checkNumSelected();

    if ( e.target.checked ){
      this.setItemStateSelected( $item );
    } else {
      this.setItemStateUnselected( $item );
    }
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
