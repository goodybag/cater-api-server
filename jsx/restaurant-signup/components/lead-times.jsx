
/*
* List of LeadTime components
*/

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
    getInitialState: function () {
      return {
        lead_times: this.props.leadTimes || defaultLeadTimes
      }
    },

    reset: function () {
      this.setState({
        lead_times: this.props.leadTimes || defaultLeadTimes
      })
    },

    val: function () {
      return this.state.lead_times;
    },

    isValid: function () {
      return true; // TODO: implement validations
    },

    addLeadTime: function (e) {
      e.preventDefault();
      var lt = { max_guests: null, lead_times: null, cancel_time: null };
      this.setState({
        lead_times: this.state.lead_times.concat([lt])
      });
    },

    updateLeadTimes: function (leadTimeProps, leadTimeState) {
      this.setState(function (state) {
        state.lead_times[leadTimeProps.index] = leadTimeState;
      });
    },

    render: function () {
      var lead_times = (this.state.lead_times).map(function (t, i) {
        return (
          <LeadTime
            key={i}
            index={i}
            maxGuests={t.max_guests}
            leadTime={t.lead_time}
            cancelTime={t.cancel_time}
            onChange={this.updateLeadTimes} />
        );
      }.bind(this));

      return (
        <div>
          {lead_times}
          <button className="btn btn-default" onClick={this.addLeadTime}>+ Add restriction</button>
        </div>
      );
    }
  });
});