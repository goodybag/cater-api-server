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
      weekdays_list_item: '.weekday-days-list li' 
    , all_days: '.select-all-days'
    };
    this.attachEvents();

    return this;
  };

  WeekDayPopover.prototype.attachEvents = function (options) {

    // toggle active days
    this.$el.find(this.selectors.weekdays_list_item).on('click', function (e) {
      e.preventDefault();
      $(e.target).toggleClass('active');
    });

    //select all days
    this.$el.find(this.selectors.all_days).on('click', function (e) {
      e.preventDefault();
      this.$el.find(this.selectors.weekdays_list_item).addClass('active');
    }.bind(this));

    // apply changes to dropdown text
    this.$el.find('.add-days').on('click', function (e) {
      e.preventDefault();
      var $el = $(e.target).parent();
      var $items = $el.find( this.selectors.weekdays_list_item + '.active' );

      var days = _.chain( $items )
        .map(function (el) { return +el.getAttribute('data-day'); })
        .groupBy(function (a, b) { return a - b; })
        .map(function (d) {
          var len = d.length;
          return len - 1 > 0 ?
             moment.weekdaysShort(d[0])+'-'+moment.weekdaysShort(d[len-1])
           : moment.weekdaysShort(d[0])
        })
        .value().join(',');

      $el.siblings('.btn-dropdown').find('.dropdown-text').text(days);
    }.bind(this));
  }

  // returns an array of days
  WeekDayPopover.prototype.days = function () {
    return;
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
        console.log(data)
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