define(function(require, exports, module) {
  var React = require('react');

  module.exports = React.createClass({
    getInitialState: function () {
      return { values: [] };
    },

    render: function () {
      var checkBoxes = this.props.checkBoxes.map(function (box, i) {
        return (
          <div className="item" key={i}>
            <input type="checkbox"
              ref={'box-'+i}
              key={i}
              name={box.name}
              id={box.name}
              value={box.value} />
            <label htmlFor={box.name} >{box.label}</label>
          </div>
        );
      });

      return (
        <div className="row">
          <div className="col-md-2">{this.props.label}</div>
          <div className="checkbox-list col-md-6">
            {checkBoxes}
          </div>
        </div>
      );
    }
  });
});
