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

  var old = $.fn.gb_collapsible;

  var Collapsible = function(el, options) {
    this.$el = $(el);
    this.options = this.getOptions(options);
    this.$target = this.options.target ? $('.'+this.options.target) : null;

    this.$el.on('click', function(e) {
      e.preventDefault();
      this.$target.toggleClass('in');
    }.bind(this));
    return this;
  };

  Collapsible.DEFAULTS = {
    trigger: 'click' // click | hover
  };

  Collapsible.prototype.getDefaults = function() {
    return Collapsible.DEFAULTS;
  };

  Collapsible.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$el.data(), options);
    return options;
  };


  // PLUGIN DEFINITION
  var Plugin = function( options ){
    return this.each(function() {
      var $this = $(this);
      var data = $this.data('gb.collapsible');

      if (!data) {
        data = new Collapsible(this, options);
        $this.data('gb.collapsible', data);
      }
    });
  };

  $.fn.gb_collapsible             = Plugin;
  $.fn.gb_collapsible.Constructor = Collapsible;

  // NO CONFLICT
  $.fn.gb_collapsible.noConflict = function() {
    $.fn.gb_collapsible = old;
    return this;
  };
}));
