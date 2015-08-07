define(function(require, exports, module) {
  var React = require('react');

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
            <input type="text" />
          </div>
          <div>
            <input type="text" />
          </div>

        </div>
      );
    }
  })

});