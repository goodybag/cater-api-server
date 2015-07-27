define(function(require, exports, module) {
  var React = require('react');
  var LeadTime = require('../components/lead-time')

  module.exports = React.createClass({
    render: function () {
      return (
        <div>
          <LeadTime />
        </div>
      );
    }
  });
});