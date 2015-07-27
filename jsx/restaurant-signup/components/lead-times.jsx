define(function(require, exports, module) {
  var React = require('react');
  var LeadTime = require('../components/lead-time')

  var defaultLeadTimes = [
    { max_guests: 25,   lead_time:  3*60, cancel_time:  2*60 }
  , { max_guests: 50,   lead_time: 12*60, cancel_time:  6*60 }
  , { max_guests: 100,  lead_time: 18*60, cancel_time: 12*60 }
  , { max_guests: 250,  lead_time: 24*60, cancel_time: 18*60 }
  , { max_guests: 2000, lead_time: 72*60, cancel_time: 72*60 }
  ];

  module.exports = React.createClass({
    render: function () {
      var lead_times = (this.props.leadTimes || defaultLeadTimes).map(function (t) {
        return (
          <LeadTime
            maxGuests={t.max_guests}
            leadTime={t.lead_time}
            cancelTime={t.cancel_time} />
        );
      });
      return (
        <div>
          {lead_times}
        </div>
      );
    }
  });
});