define(function(require, exports, module) {
  var React = require('react');
  var Input = require('../components/input');
  var LeadTimes = require('../components/lead-times')
  var requestMixin = require('../mixins/requests');

  module.exports = React.createClass({
    mixins: [requestMixin],

    getFields: function () {
      return ['delivery_fee', 'delivery_times', 'pickup_lead_times'];
    },

    render: function () {
      return (
        <div>
          <h2>Delivery Info</h2>
          <Input label= "Delivery Fee" ref="delivery_fee" />
          <div>
            <h3>Delivery Lead Times</h3>
            <LeadTimes ref="delivery_times" />
          </div>
          <div>
            <h3>Pickup Lead Times</h3>
            <LeadTimes ref="pickup_lead_times" />
          </div>
        </div>
      );
    }
  });
});
