define(function (require, exports, module) {
  var utils = require('utils');
  var spinner = require('spinner');
  var BaseView = require('./base-view');
  var Handlebars = require('handlebars');
  var _ = require('lodash');

  return module.exports = BaseView.extend({
    events: utils.extend(BaseView.prototype.events, {
      'click .add-custom-lead-times'  : 'addCustomLeadTime'
    , 'click .default-lead-times'     : 'defaultLeadTimes'
    , 'click .add-restriction'        : 'addLeadTimeRestriction'
    , 'click .add-hours'              : 'addHours'
    , 'click .add-days'               : 'setDays'
    , 'click .datetime-days-list > li': 'setDeliveryHours'
    })

  , fieldMap: {
      delivery_fee     : '.delivery-fee'
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
      var this_ = this;
      this.clearErrors();
      // Input field values. We're not using fieldGetters here
      // b/c some inputs give a 'default' option (i.e default lead times)
      var fields = {
        delivery_fee: Math.abs(this.$el.find(this.fieldMap.delivery_fee).val())
      , lead_times: this.$el.find(this.fieldMap.lead_times+':checked').val()
      , pickup_lead_times: this.$el.find(this.fieldMap.pickup_lead_times+':checked').val()
      , delivery_hours: this.$el.find(this.fieldMap.delivery_hours)
      };

      if (!fields.delivery_fee || !parseInt(fields.delivery_fee)) {
        return this.displayErrors([{
          property: 'delivery_fee'
        , message: 'Please provide a delivery fee.'
        }]);
      }

      if (!fields.lead_times) {
        return this.displayErrors([{
          property: 'lead_times'
        , message: 'Please select delivery lead times'
        }]);
      }

      if (!fields.pickup_lead_times) {
        return this.displayErrors([{
          property: 'pickup_lead_times'
        , message: 'Please select pick lead times'
        }]);
      }

      for (var i=0; i < fields.delivery_hours.length; i++) {
        var days = fields.delivery_hours.eq(i).find('.datetime-days-list > li.active');
        if (days.length < 1) {
          return this.displayErrors([{
            selector: '.gb-dropdown'
          , message: 'Please select a day.'
          }]);
        }
        var startTime = fields.delivery_hours.eq(i).find('.delivery-hours-start').val();
        var endTime = fields.delivery_hours.eq(i).find('.delivery-hours-end').val();
        if (!startTime || !endTime) {
          return this.displayErrors([{
            selector: '.delivery-hours-end'
          , message: 'Please select a delivery time.'
          }]);
        }
      }

      var fieldsData = {
        gb_fee: fields.gb_fee
      , lead_times: this.fieldGetters.lead_times.call(this)
      , pickup_lead_times: this.fieldGetters.pickup_lead_times.call(this)
      , delivery_hours: this.fieldGetters.delivery_hours.call(this)
      };

      this.model.set(this.getDiff());
      $.ajax({
        type: 'PUT'
      , url: '/api/restaurants/join'
      , dataType: 'JSON'
      , data: { step: 4, data: JSON.stringify( this.model.toJSON() )}
      , success: function () {
          this_.$el.animate({
            left: '-100px',
            opacity: '0'
          }, 300, function () {
            window.scrollTo(0,0);
            window.location.reload();
          });
        }
      , error: function (error) {
          console.error('failed ', error);
        }
      });
    }

  , addCustomLeadTime: function(e) {
      var template = Handlebars.partials.edit_lead_times;
      var html = template( this.model.toJSON() );
      var type = $(e.target).data('type');
      this.$el.find('.:type-lead-times-container'.replace(':type', type)).html( html );
    }

  , addLeadTimeRestriction: function (e) {
      e.preventDefault();
      var template = Handlebars.partials.lead_time;
      $( template() ).insertBefore( e.target );
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
