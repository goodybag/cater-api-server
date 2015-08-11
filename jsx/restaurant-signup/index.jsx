define(function(require, exports, module) {
  var React = require('react');
  var _ = require('lodash');
  var Restaurant = require('app/models/restaurant');
  var SignupNav = require('./components/signup-nav');
  var Steps =require('./steps/index.js');

  module.exports = React.createClass({
    getInitialState: function () {
      return { step: 3 }
    },

    getStep: function () {
      return this.state.step;
    },

    nextStep: function () {
      var next = this.state.step + 1;
      if (next > Steps.length - 1) next = Steps.length - 1;

      this.setState({
        step: next
      });
    },

    saveAndContinue: function (e) {
      e.preventDefault();
      this.refs.step.submitForm(function (error, response) {
        if (error) return console.log(error);
        // update step state
        this.nextStep();
      }.bind(this));
    },

    render: function () {
      var Step = Steps[this.state.step].component;

      return (
        <div>
          <SignupNav steps={_.pluck(Steps, 'name')} step={this.state.step} />
          <form onSubmit={this.saveAndContinue}>
            <Step ref="step" model={this.props.model} />
            <button className="btn btn-default">Save and Continue</button>
          </form>
        </div>
      );
    }
  });
});
