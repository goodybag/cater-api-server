define(function(require, exports, module) {
  var React = require('react');
  var utils = require('utils');
  var pickatime = require('pickatime');

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
    mixins: [requestMixin],

    componentDidMount: function () {
      $(this.refs.hoursFrom.getDOMNode()).pickatime();
      $(this.refs.hoursTo.getDOMNode()).pickatime();
    },

    getFields: function () {
      return []; // TODO: add fields
    },

    render: function () {
      var selectDays = (function () {
        return (
            <select ref="day">
              <option key={-1} value=''>Choose Day</option>
              {daysOfWeek.map(function (day, i) {
                return (<option key={i} value={i}>{day}</option>);
              })}
            </select>
          );
      })();

      return (
        <div>
          <div>
            {selectDays}
          </div>
          <div>
            <input type="text"ref="hoursFrom" />
          </div>
          <div>
            <input type="text" ref="hoursTo" />
          </div>

        </div>
      );
    }
  })

});