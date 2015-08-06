define(function(require, exports, module) {
  var React = require('react');

  var Restaurant = require('app/models/restaurant');
  var Input = require('../components/input');
  var CheckBoxList = require('../components/checkbox-list');
  var requestMixin = require('../mixins/requests');

  var servicesCheckBoxes = [
    { label: 'Delivery and Pickup', name: 'both', value: 'both' }
  , { label: 'Delivery Only', name: 'delivery', value: 'delivery' }
  , { label: 'Pickup Only', name: 'pickup', value: 'pickup' }
  ];

  module.exports = React.createClass({
    propTypes: {
      model: React.PropTypes.instanceOf(Restaurant).isRequired
    },

    mixins: [requestMixin],

    getFields: function () {
      return ['name', 'website'];
    },

    render: function () {
      return (
        <div>
          <h2>Start Feeding offices</h2>
          <p>Get exposure to hundreds of orders and new customers</p>

          <Input
            label="Restaurant Name"
            ref="name"
            errorMessage="Please provide a restaurant name"
            required="true" />
          <Input
            label="Restaurant Website"
            ref="website" />
          <CheckBoxList ref="delivery_services" label="Which can you provide?" checkBoxes={servicesCheckBoxes} />
        </div>
      );
    }
  });
});
