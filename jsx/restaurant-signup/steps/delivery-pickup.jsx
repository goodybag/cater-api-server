define(function(require, exports, module) {
  var React = require('react');
  var Input = require('../components/input');
  var LeadTimes = require('../components/lead-times')

  module.exports = React.createClass({
    getFields: function () {
      return []; // TODO: add form fields
    },

    render: function () {
      return (
        <div>
          <h2>Delivery Info</h2>
          <Input label= "Delivery Free" />
          <h3>Delivery Lead Times</h3>
          <LeadTimes />
        </div>
      );
    }
  });
});
