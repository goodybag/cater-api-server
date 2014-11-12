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

  var old = $.fn.gb_popover;

  var Popover = function(el, options) {
    this.$el = $(el);
    this.options = this.getOptions(options);
    this.$target = this.options.target ? $('.'+this.options.target) : null;
    this.listenEvents();
    return this;
  };

  Popover.DEFAULTS = {
    trigger: 'click' // click | hover
  };

  Popover.prototype.getDefaults = function() {
    return Popover.DEFAULTS;
  };

  Popover.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$el.data(), options);
    return options;
  };

  Popover.prototype.listenEvents = function (options) {
    var this_ = this;
    var $el = this.$el;

    // click outside to close modal
    $(document).click(function(e) {
      var clickedOutsideModal =
        !$(e.target).closest(this.$target).length &&
        !$(e.target).closest(this.$el).length &&
        this.$target.hasClass('open');
      if ( clickedOutsideModal ) {
        this.$target.removeClass('open');
      }
    }.bind(this));

    // click, hover, or focus based triggers
    var trigger = this.options.trigger;
    if ( trigger === 'click' ) {
      $el.on('click', function(e) {
        e.preventDefault();
        this_.toggle();
      });
    } else if ( trigger === 'hover' ) {
      $el.on('mouseenter', function(e) {
        e.preventDefault();
        this_.open();
      });
      $el.on('mouseleave', function(e) {
        e.preventDefault();
        this_.close();
      });
      $el.on('click', function(e) {
        e.preventDefault();
        this_.toggle();
      });
    } else if ( trigger === 'focus' ) {

    }

    // Listen to close buttons
    if (this.$target) {
      this.$target.find('[data-toggle-role="close"]').on('click', function(e) {
        e.preventDefault();
        this_.close();
      });
    }

    return this;
  };

  Popover.prototype.open = function() {
    if (this.$target) this.$target.addClass('open');
    return this;
  };

  Popover.prototype.close = function() {
    if (this.$target) this.$target.removeClass('open');
    return this;
  };

  Popover.prototype.toggle = function() {
    if (this.$target) this.$target.toggleClass('open');
    return this;
  };

  // PLUGIN DEFINITION
  var Plugin = function( options ){
    return this.each(function() {
      var $this = $(this);
      var data = $this.data('gb.popover');

      if (!data) {
        data = new Popover(this, options);
        $this.data('gb.popover', data);
      }
    });
  };

  $.fn.gb_popover             = Plugin;
  $.fn.gb_popover.Constructor = Popover;

  // NO CONFLICT
  $.fn.gb_popover.noConflict = function() {
    $.fn.gb_popover = old;
    return this;
  };
}));
