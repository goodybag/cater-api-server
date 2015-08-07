define(function(require, exports, module) {
  var React = require('react');
  var utils = require('utils');
  var pickatime = require('pickatime');
  var isValid = require('../mixins/is-valid');

  var daysOfWeek = [
    'Sunday'
  , 'Monday'
  , 'Tuesday'
  , 'Wednesday'
  , 'Thursday'
  , 'Friday'
  , 'Saturday'
  ];

  module.exports = React.createClass({
    mixins: [isValid],

    getInitialState: function () {
      return {
        day: null
      , from : null
      , to: null
      };
    },

    componentDidMount: function () {
      $(this.refs.hoursFrom.getDOMNode()).pickatime({ onSet: this.setHours.bind(this, 'from')});
      $(this.refs.hoursTo.getDOMNode()).pickatime({ onSet: this.setHours.bind(this, 'to')});
    },

    val: function () {
      return this.state;
    },

    setDay: function (e) {
      this.setState({
        day: e.target.value
      });
    },

    setHours: function (name, ctx) {
      this.setState(function (state) {
        state[name] = ctx.select;
      });
    },

    render: function () {

      var selectDays = (function () {
        return (
            <select ref="day" name="day" onChange={this.setDay} >
              <option key={-1} value=''>Choose Day</option>
              {daysOfWeek.map(function (day, i) {
                return (<option key={i} value={i}>{day}</option>);
              }.bind(this))}
            </select>
          );
      }.bind(this))();

      return (
        <div>
          <div>
            {selectDays}
          </div>
          <div>
            <input type="text"ref="hoursFrom" name="form" />
          </div>
          <div>
            <input type="text" ref="hoursTo" name="to" />
          </div>

        </div>
      );
    }
  })

});