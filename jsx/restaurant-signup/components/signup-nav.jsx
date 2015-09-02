
/*
* SignupNav Component
* Props:
*  @step - will likely be the current step state of the signup form
*  @steps - an ordered array of step names
*   ex.
*    ['Basic Info', 'Payment', ...]
*/

define(function(require, exports, module) {
  var React = require('react');

  module.exports = React.createClass({
    propTypes: {
      steps: React.PropTypes.array
    , step: React.PropTypes.number
    },

    render: function () {
      var items = this.props.steps.map(function (step, i) {
        return (
          <li className={this.props.step === i ? 'active' : ''} key={i}>
            <span className="step-number">{i + 1}</span>
            <span>{step}</span>
          </li>
          );
      }.bind(this));

      return (<ul>{items}</ul>);
    }
  });
});
