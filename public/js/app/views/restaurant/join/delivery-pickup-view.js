define(function (require, exports, module) {
  var utils = require('utils');
  var spinner = require('spinner');
  var BaseView = require('./base-view');
  var Handlebars = require('handlebars');

  return module.exports = BaseView.extend({
    events: {
      'click .add-lead-time'          : 'addLeadTime'
    , 'click .add-hours'              : 'addHours'
    , 'click .add-days'               : 'addDays'
    , 'click .datetime-days-list > li': 'addDeliveryHours'
    }

  , fieldMap: {
      delivery_fee    : '.delivery-fee' // this may be the wrong column
    , delivery_times  : '.delivery-lead-times' // (require some extra mapping)
    , pickup_lead_time: '' // (require some extra mapping)
    }

  , fieldGetter: {

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
    }

  , addLeadTime: function(e) {
      if (e) e.preventDefault();
      this.$el.find('.lead-times-list').append(Handlebars.partials.lead_time());
    }

  , addDays: function (e) {
      if (e) e.preventDefault();
      console.log('adding delivery days')
    }

  , addHours: function (e) {
      if (e) e.preventDefault();
    }

  , addDeliveryHours: function (e) {
      if (e) e.preventDefault();
      var $el = $(e.target);
      console.log('click', $el.data('day'))
      $el.toggleClass('active');
      //this.set('hours_of_operation', hours)
    }
    
  , onTimePickerSet: function( ctx ){
      console.log(ctx)
      if ( 'select' in ctx ){
      }
    }
  });
});
