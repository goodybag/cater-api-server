define(function(require, exports, module) {
  var React = require('react');
  var Input = require('../components/input');
  var LeadTimes = require('../components/lead-times')
  var HoursDropDown = require('../components/hours-dropdown')
  var requestMixin = require('../mixins/requests');

  module.exports = React.createClass({
    mixins: [requestMixin],

    getFields: function () {
      return ['delivery_fee', 'delivery_times', 'pickup_lead_times'];
    },

    toggleLeadTimes: function (ref, e) {
      var el = this.refs[ref].getDOMNode();

      // TODO: replace classList with a more IE friendly method
      if (e.target.value === "custom") {
        return el.classList.remove('hide');
      }
      return el.classList.add('hide');
    },

    render: function () {
      var leadTimesToggler = function (ref) {
        return (
          <div>
            <div>
             <input type="radio" onChange={this.toggleLeadTimes.bind(this, ref)} id={"default-"+ref} name={"name-"+ref} value="default" />
             <label htmlFor={"default-"+ref}>
              Use default lead times
             </label>
            </div>
            <div>
              <input type="radio" onChange={this.toggleLeadTimes.bind(this, ref)} id={"custom-"+ref} name={"name-"+ref} value="custom" />
              <label htmlFor={"custom-"+ref}>
              Customize my lead times
              </label>
            </div>
          </div>
          );
      }.bind(this);

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

            {leadTimesToggler("delivery_times_container")}
            <div ref="delivery_times_container" className="hide">
              <LeadTimes ref="delivery_times" />
            </div>
          </div>

          <div>
            <h3>Pickup Lead Times</h3>
            <p>The time you need to prepare an order that is being picked
            up by an outside party. Below are the lead times we recommend
            for our restaurants. The smaller the lead time, the more orders
            you can receive. <strong>Cancel Time</strong> is the amount of
            notice needed if someone wants to cancel their order with you.</p>

            {leadTimesToggler("pickup_lead_times_container")}
            <div ref="pickup_lead_times_container" className="hide">
              <LeadTimes ref="pickup_lead_times" />
            </div>
          </div>

          <div>
            <h3>Hours of Operation</h3>

            <HoursDropDown />

          </div>
        </div>
      );
    }
  });
});
