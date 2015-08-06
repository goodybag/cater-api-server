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
            <p>The time you need to prepare and deliver an order for a given
            number of guests. Below are the lead times we recommend for our
            restaurants. The smaller the lead time, the more orders you can
            receive. <strong>Cancel Time</strong> is the amount of notice
            needed if someone wants to cancel their order with you.</p>
            <LeadTimes ref="delivery_times" />
          </div>
          <div>
            <h3>Pickup Lead Times</h3>
            <p>The time you need to prepare an order that is being picked
            up by an outside party. Below are the lead times we recommend
            for our restaurants. The smaller the lead time, the more orders
            you can receive. <strong>Cancel Time</strong> is the amount of
            notice needed if someone wants to cancel their order with you.</p>
            <LeadTimes ref="pickup_lead_times" />
          </div>
        </div>
      );
    }
  });
});
