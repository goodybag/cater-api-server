define(function(require, exports, module) {
  var React = require('react');
  var isValid = require('../mixins/is-valid')

  module.exports = React.createClass({

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
              <input type="text" value={this.state.value} />
            </div>
            <span>OR</span>
            <div className="row">
              <label>Upload a file:</label>
              <input
                type="text"
                placeholder={this.state.value || "No file selected"}
                readOnly="true" />
            </div>
            <button className="btn btn-default" onClick={this.addFile}>Pick file</button>

          </div>
        </div>
      );
    }
  })
})
