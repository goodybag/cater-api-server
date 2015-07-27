define(function(require, exports, module) {
  var React = require('react');
  var Input = require('../components/input');
  var LeadTimes = require('../components/lead-times')

  module.exports = React.createClass({
    render: function () {
      return (
        <div>
          <h1>Delivery Info</h1>
          <Input label= "Delivery Free" />
          <LeadTimes />
        </div>
      );
    }
  });
});
