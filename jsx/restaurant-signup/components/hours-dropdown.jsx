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
      if (this.state.days.length < 1) {
        return this.setState({
          days: this.state.days.concat(val)
        });
      }

      var days = this.state.days;
      var index = days.indexOf(val);
      if ( index > -1 ) days = days.splice(index, 1);
      var group = utils.groupBy(days, function (a, b) { return a - b; });
      var newState = [];

      var handleGroup = function (g) {
        var max = Math.max.apply(Math, g);
        var min = Math.min.apply(Math, g);
        var s = [];

        if (val <= max && val >= min) max = val
        else if (val >= max) max = val
        else if (val <= min) min = val

        for (var i = min, s = []; i <= max; i++) s.push(i)

        return s;
      };

      for (var k in group) newState.push(handleGroup(group[k]))

      this.setState({
        days: utils.flatten(newState)
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