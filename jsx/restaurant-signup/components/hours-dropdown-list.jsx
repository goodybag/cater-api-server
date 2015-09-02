
/*
*  List of HoursDropDown Components
*/

define(function(require, exports, module) {
  var React = require('react');
  var HoursDropDown = require('./hours-dropdown');

  module.exports = React.createClass({
    getInitialState: function () {
      return { hours: this.props.hours || [{}] };
    },

    val: function () {
      return this.state.hours;
    },

    isValid: function () {
      return true; // TODO: implement validations
    },

    addHours: function (e) {
      e.preventDefault();

      this.setState({
        hours: this.state.hours.concat({})
      });
    },

    render: function () {
      return (
        <div>
          {this.state.hours.map(function (hours, i) {
            return <HoursDropDown ref={"hours-"+i} key={i} hours={hours} />;
          })}
          <button onClick={this.addHours}>+ Add hours</button>
        </div>
      );
    }
  });
});
