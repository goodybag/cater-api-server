define(function(require, exports, module) {
  var React = require('react');
  var LeadTimes = require('../../../dist/restaurant-signup/components/lead-times.js');

  describe('Lead Times Component', function () {

    it('should have default lead times', function () {
      var leadTimes = React.createElement(LeadTimes, null);
      var component = React.render(leadTimes, document.createElement('div'));
      var defaultLeadTimes = [
        { max_guests: 25,   lead_time:  3*60, cancel_time:  2*60 }
      , { max_guests: 50,   lead_time: 12*60, cancel_time:  6*60 }
      , { max_guests: 100,  lead_time: 18*60, cancel_time: 12*60 }
      , { max_guests: 250,  lead_time: 24*60, cancel_time: 18*60 }
      , { max_guests: 2000, lead_time: 72*60, cancel_time: 72*60 }
      ];

      expect(component.val()).toEqual(defaultLeadTimes);

    });

  /*
    it('should add lead times', function () {

    });

    it('should reset default lead times', function () {

    });

    it('.val() should return lead time value', function () {

    });
  */
  });

});