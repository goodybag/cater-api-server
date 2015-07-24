define(function(require, exports, module) {
  var React = require('react');
  var isValid = require('../mixins/is-valid');

  module.exports = React.createClass({
    propTypes: {
      type: React.PropTypes.string,
      label: React.PropTypes.string,
      name: React.PropTypes.string,
      errorMessage: React.PropTypes.string,
      value: React.PropTypes.any
    },

    mixins: [isValid],

    getInitialState: function () {
      return {
        value: this.props.value || ''
      };
    },

    onChange: function (event) {
      this.setState({
        value: event.target.value
      });
    },

    val: function () {
      return this.state.value;
    },

    //TODO: using classList breaks < IE9
    displayError: function () {
      this.refs.error.getDOMNode().classList.remove('hide');
    },

    removeError: function () {
      this.refs.error.getDOMNode().classList.add('hide');
    },

    render: function () {
      return (
        <div className="row">
          <label className="col-md-2">{this.props.label}</label>
          <div className="col-md-6">
            <div ref="error" className="error hide">
              {this.props.errorMessage}
            </div>
            <input
              type={this.props.type || "text"}
              name={this.props.name}
              className="form-control"
              onChange={this.onChange}
              value={this.state.value} />
          </div>
        </div>
      );
    }
  });
});
