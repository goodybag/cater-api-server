define(function(require, exports, module) {
  var React = require('react');

  module.exports = React.createClass({

    getInitialState: function () {
      return {
        max_guests: this.props.maxGuests || null
      , lead_time: this.props.leadTime || null
      , cancel_time: this.props.cancelTime || null
      };
    },

    val: function () {
      return this.state;
    },

    render: function () {
      return (
        <div className="row">
          <div>
            <input name="max_guests" type="text" onChange={this.updateLeadTime} value={this.state.max_guests} />
          </div>
          <div>
            <input name="lead_time" type="text" onChange={this.updateLeadTime} value={this.state.lead_time} />
          </div>
          <div>
            <input name="cancel_time" type="text" onChange={this.updateLeadTime} value={this.state.cancel_time} />
          </div>
        </div>
      );
    }
  });
});