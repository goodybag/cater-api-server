define(function( require ){
  'use strict';

  var $     = require('jquery');
  var utils = require('lodash');
  utils.search = require('utils').search;

  var old = $.fn.gb_tablelist;

  var FilterList = function( el, options ){
    this.$el = $(el);
    this.options = utils.defaults( options || {}, FilterList.DEFAULTS );

    this.value  = '';

    this.$input = this.$el.find( this.$el.data('input') );
    this.$items = this.$el.find( this.$el.data('target') );
    this.fields = this.$el.data('fields').split(',');

    this.data   = this.getDataFromItems();

    this.$input.on( this.options.inputListenEvent, this.onInputChange.bind( this ) );

    return this;
  };


  FilterList.DEFAULTS = {
    inputListenEvent: 'keyup'
  };

  FilterList.prototype.getDataFromItems = function() {
    var data = [];
    var this_ = this;

    this.$items.each( function(){
      var $el = $(this);
      var item = { $el: $el };

      this_.fields.forEach( function( field ){
        item[ field ] = $el.data( field );
      });

      data.push( item );
    });

    return data;
  };

  FilterList.prototype.filter = function( input ){
    if ( !input ){
      this.$items.css( 'display', '' );
      return this;
    }

    this.$items.css( 'display', 'none' );

    utils.search(
      this.data, input, this.fields
    ).forEach( function( item ){
      item.$el.css( 'display', '' );
    });

    return this;
  };

  FilterList.prototype.onInputChange = function( e ){
    this.filter( e.target.value );
  };

  var Plugin = function( options ){
    return this.each(function() {
      var $this = $(this);
      var data = $this.data('gb.filterlist');

      if (!data) {
        data = new FilterList(this, options);
        $this.data('gb.filterlist', data);
      }
    });
  };

  $.fn.gb_filterlist             = Plugin;
  $.fn.gb_filterlist.Constructor = FilterList;

  // NO CONFLICT
  $.fn.gb_filterlist.noConflict = function() {
    $.fn.gb_filterlist = old;
    return this;
  };

  $(function(){
    $('[data-role="filter-list"]').gb_filterlist();
  })
});
