define(function(require, exports, module) {
  var React = require('react');
  var utils = require('utils');
  var pickatime = require('pickatime');
  var $ = require('jquery');
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
          days: []
        , from : null
        , to: null
        };
    },

    componentDidMount: function () {
      $(this.refs.hoursFrom.getDOMNode()).pickatime({ onSet: this.setHours.bind(this, 'from')});
      $(this.refs.hoursTo.getDOMNode()).pickatime({ onSet: this.setHours.bind(this, 'to')});
      $('[data-role="popover"]').gb_popover();
    },

    val: function () {
      return this.state;
    },

    setDay: function (e) {
      var val = parseInt(e.target.getAttribute('data-value'));

      var days = this.state.days;
      var index = days.indexOf(val);

      // toggle day
      if (index > -1) days.splice(index, 1)
      else days.push(val)

      this.setState({
        days: days
      });
    },

    setHours: function (name, ctx) {
      this.setState(function (state) {
        state[name] = ctx.select;
      });
    },

    render: function () {
      console.log(this.state.days);

      var hoursPopover = (function () {
        return (
          <div>
            <span id="hours-dropdown" className="popover-wrapper gb-dropdown">
              <button className="btn btn-default btn-dropdown" data-role="popover" data-target="hours-dropdown">
              Choose Day
              <i className="gb-icon-caret-down"></i>
              </button>
              <div className="popover-modal hours-dropdown">
                <div className="popover-body">
                  {daysOfWeek.map(function (day, i) {
                    return (
                      <div className={this.state.days.indexOf(i) > -1 ? 'active' : ''} data-value={i} onClick={this.setDay}>{day}</div>
                    );
                  }.bind(this))}
                </div>
              </div>
            </span>
          </div>
          );
      }.bind(this))();

      return (
        <div>
          {hoursPopover}
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