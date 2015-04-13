define(function (require, exports, module) {
  var utils = require('utils');
  var spinner = require('spinner');
  var BaseView = require('./base-view');
  var Handlebars = require('handlebars');

  return module.exports = BaseView.extend({
    events: utils.extend(BaseView.prototype.events, {
      'click .add-custom-lead-times'  : 'setLeadTime'
    , 'click .default-lead-times'     : 'defaultLeadTimes'
    , 'click .add-hours'              : 'setHours'
    , 'click .add-days'               : 'setDays'
    , 'click .datetime-days-list > li': 'setDeliveryHours'
    })

  , fieldMap: {
      gb_fee           : '.delivery-fee' // this may be the wrong column
    , lead_times       : '.delivery-lead-times'
    , pickup_lead_times: '.pickup-lead-times'
    }

  , fieldGetters: {
      lead_times: function () {
        var leadTimesView = this.options.deliveryLeadTimesView;
        var lt = leadTimesView.fieldGetters.lead_times.call(leadTimesView);
        return lt.length > 0 ? lt : this.model.get('lead_times') || null;
      },
      pickup_lead_times: function () {
        var leadTimesView = this.options.pickupLeadTimesView;
        var lt = leadTimesView.fieldGetters.lead_times.call(leadTimesView);
        return lt.length > 0 ? lt : this.model.get('pickup_lead_times') || null;
      }
    }

  , initialize: function (options) {
      BaseView.prototype.initialize.apply(this, options);
      console.log('init delivery pickup view');

      this.deliveryHoursStart = this.$el.find("input[name='time']").pickatime({
        format: 'h:i A'
      , interval: 15
      }).pickatime('picker');

      this.deliveryHoursEnd = this.$el.find("input[name='time']").pickatime({
        format: 'h:i A'
      , interval: 15
      }).pickatime('picker');

      this.deliveryHoursStart.on( 'set', _(this.onTimePickerSet).bind(this) );
      this.deliveryHoursEnd.on( 'set', _(this.onTimePickerSet).bind(this) );

    }
  , submit: function (e) {
      e.preventDefault();
      var fields = {
        gb_fee: this.$el.find(this.fieldMap.gb_fee).val()
      , lead_times: this.fieldGetters.lead_times.call(this)
      , pickup_lead_times: this.fieldGetters.pickup_lead_times.call(this)
      };

      this.setCookie('4');
      window.location.reload();
    }

  , setLeadTime: function(e) {
      var template = Handlebars.partials.edit_lead_times;
      var html = template( this.model.toJSON() );
      var type = $(e.target).data('type');
      this.$el.find('.:type-lead-times-container'.replace(':type', type)).html( html );
    }
  , defaultLeadTimes: function (e) {
      var type = $(e.target).data('type');
      this.$el.find('.:type-lead-times-container'.replace(':type', type)).empty();
    }

  ,setDays: function (e) {
      if (e) e.preventDefault();
      var $parent = $(e.target).parent();
      var days = utils.map($parent.find('.datetime-days-list > li.active')
        , function (el) {
          return +el.getAttribute('data-day');
        });
      days = utils.groupBy(days, function (i, d) { return i - d; });
      days = utils.map(days, function (d) {
        var len = d.length;
        return len - 1 > 0 ?
          moment.weekdaysMin(d[0])+'-'+moment.weekdaysMin(d[len-1])
          : moment.weekdaysMin(d[0]);
        }).join(',');
        $parent.siblings('.btn-dropdown').find('.dropdown-text').text(days);
    }

  , setHours: function (e) {
      if (e) e.preventDefault();
      var $el = $(e.target);
      var template = Handlebars.partials.edit_delivery_hours;
      $el.parent().find('.delivery-hours-container').append(template());
      $('[data-role="popover"]').gb_popover();
    }

  , setDeliveryHours: function (e) {
      if (e) e.preventDefault();
      var $el = $(e.target);
      $el.toggleClass('active');
    }
    
  , onTimePickerSet: function( ctx ){
      console.log(ctx)
      if ( 'select' in ctx ){
      }
    }
  });
});
