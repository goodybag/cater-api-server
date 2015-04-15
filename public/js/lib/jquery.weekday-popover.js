if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var $ = require('jquery');
  var Popover = require('jquery.popover');
  var _ = require('lodash');
  var moment = require('moment');

  var old = $.fn.gb_weekday_popover;

  var WeekDayPopover = function (el, options) {
    Popover.call(this, el, options);
    this.$el = $(el).parent();
    this.selectors = {
      item_day: '.weekday-days-list li'
    , all_days: '.select-all-days'
    };
    this.attachEvents();

    return this;
  };

  WeekDayPopover.prototype.attachEvents = function (options) {
    var $el = this.$el;
    var this_ = this;

    // toggle active days
    $el.find( this_.selectors.item_day ).on('click', function (e) {
      e.preventDefault();
      $(e.target).toggleClass('active');
    });

    //select all days
    $el.find( this_.selectors.all_days ).on('click', function (e) {
      e.preventDefault();
      this_.$el.find( this_.selectors.item_day ).addClass('active');
    });

    // apply changes to dropdown text
    $el.find('.add-days').on('click', function (e) {
      e.preventDefault();
      this_.setDropdownText( this_.daysText() );
    });
  };

  /**
  * days
  * @return {Array} - list of days represented as numbers.
  */
  WeekDayPopover.prototype.days = function () {
    var $items = this.$el.find( this.selectors.item_day + '.active' );
    return _.chain( $items )
        .map(function (el) { return +el.getAttribute('data-day'); })
        .groupBy(function (a, b) { return a - b; })
        .value();
  };

  WeekDayPopover.prototype.daysText = function() {
    return _.map(this.days(), function (d) {
          var len = d.length;
          return len - 1 > 0 ?
             moment.weekdaysShort(d[0])+'-'+moment.weekdaysShort(d[len-1])
           : moment.weekdaysShort(d[0])
        })
        .join(',');
  };

  WeekDayPopover.prototype.setDropdownText = function(text) {
    this.$el.find('.dropdown-text').text(text);
    return this;
  };

  WeekDayPopover.prototype.close = function() {
    if (this.$wrapper) this.$wrapper.removeClass('open');
    this.setDropdownText( this.daysText() || 'Choose a day' );
    return this;
  };

  // inherit from Popover
  _.extend(WeekDayPopover.prototype, Popover.prototype);

  // PLUGIN DEFINITION
  var Plugin = function( options ){
    return this.each(function() {
      var $this = $(this);
      var data = $this.data('gb.weekday-popover');

      if (!data) {
        data = new WeekDayPopover(this, options);
        $this.data('gb.weekday-popover', data);
      }
    });
  };

  $.fn.gb_weekday_popover             = Plugin;
  $.fn.gb_weekday_popover.Constructor = WeekDayPopover; 

  // NO CONFLICT
  $.fn.gb_popover.noConflict = function() {
    $.fn.gb_weekday_popover = old;
    return this;
  };

});