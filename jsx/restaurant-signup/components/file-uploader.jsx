define(function(require, exports, module) {
  var React = require('react');
  var isValid = require('../mixins/is-valid')

  module.exports = React.createClass({
    propTypes: {
      label: React.PropTypes.string,
      errorMessage: React.PropTypes.string,
      value: React.PropTypes.string
    },

    mixins: [isValid],

    getInitialState: function () {
      return {
        value: this.props.value || ''
      };
    },

    addFile: function (e) {
      e.preventDefault();
      if (filepicker) {
        filepicker.pick(function (blob) {
          this.setState({
            value: blob.url
          });
        }.bind(this));
      }
    },

    val: function () {
      return this.state.value;
    },

    // TODO: using classList breaks < IE9
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

            <div className="row">
              <label>Enter a link:</label>
              <div>
                <input type="text" onChange={this.addFile} value={this.state.value} />
              </div>
            </div>
            <span>OR</span>
            <div className="row">
              <label>Upload a file:</label>
              <div>
                <input
                  type="text"
                  placeholder={this.state.value || "No file selected"}
                  readOnly="true" />
              </div>
            </div>
            <button className="btn btn-default" onClick={this.addFile}>Pick file</button>
          </div>
        </div>
      );
    }
  })
})
