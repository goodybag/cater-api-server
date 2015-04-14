define(function (require, exports, module) {
  var utils = require('utils');
  var spinner = require('spinner');
  var BaseView = require('./base-view');
  var Handlebars = require('handlebars');
  var _ = require('lodash');

  return module.exports = BaseView.extend({
    events: utils.extend(BaseView.prototype.events, {
      'click .add-custom-lead-times'  : 'setLeadTime'
    , 'click .default-lead-times'     : 'defaultLeadTimes'
    , 'click .add-hours'              : 'addHours'
    , 'click .add-days'               : 'setDays'
    , 'click .datetime-days-list > li': 'setDeliveryHours'
    })

  , fieldMap: {
      gb_fee           : '.delivery-fee' // this may be the wrong column
    , lead_times       : '.delivery-lead-times'
    , pickup_lead_times: '.pickup-lead-times'
    , delivery_hours   : '.delivery-hours'
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
      },
      delivery_hours: function () {
        var currentTimes = this.model.get('delivery_times') || {};
        var $deliveryTimes = this.$el.find(this.fieldMap.delivery_hours)
        return _.extend(currentTimes, _.reduce($deliveryTimes, function (result, el, key) {
          var $el = $(el);
          var hours = [
            $el.find('.delivery-hours-start').val()
          , $el.find('.delivery-hours-end').val()
          ];

          $el.find('.datetime-days-list > li.active').each(function (i, el) {
            var day = el.getAttribute('data-day');
            if (day in result) result[day].push(hours)
            else result[day] = [hours]
          });
          return result;
        }, {}) );
      }
    }

  , initialize: function (options) {
      BaseView.prototype.initialize.apply(this, options);
      console.log('init delivery pickup view');

      this.setPickers();

    }

  , setPickers: function () {
      this.$el.find("input[name='time']").pickatime({
        format: 'h:i A'
      , interval: 15
      }).pickatime('picker');

      this.$el.find("input[name='time']").pickatime({
        format: 'h:i A'
      , interval: 15
      }).pickatime('picker');
    }

  , submit: function (e) {
      e.preventDefault();
      var fields = {
        gb_fee: this.$el.find(this.fieldMap.gb_fee).val()
      , lead_times: this.fieldGetters.lead_times.call(this)
      , pickup_lead_times: this.fieldGetters.pickup_lead_times.call(this)
      , delivery_hours: this.fieldGetters.delivery_hours.call(this)
      };

      console.log(fields.delivery_hours);

      //this.setCookie('4');
      //window.location.reload();
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

  , setDays: function (e) {
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

  , addHours: function (e) {
      if (e) e.preventDefault();
      var $el = $(e.target);
      var template = Handlebars.partials.edit_delivery_hours;
      $el.parent().find('.delivery-hours-container').append(template());
      $('[data-role="popover"]').gb_popover();
      this.setPickers();
    }

  , setDeliveryHours: function (e) {
      if (e) e.preventDefault();
      var $el = $(e.target);
      $el.toggleClass('active');
    }
    
  });
});
