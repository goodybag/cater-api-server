
/*
* Creates a list of checkboxes
* Props:
*   @label - label for the entire checkbox list
*   @checkBoxes - array of checkbox properties for
*                 each item in the list
*   ex.
*     [ {label: 'Vegan', name: 'vegan', value: 'vegan' }, ... ]
*     so each checkbox list item will have it's own label, a name
*     and a value
*/

define(function(require, exports, module) {
  var React = require('react');
  var isValid = require('../mixins/is-valid');

  module.exports = React.createClass({

    propsTypes: {
      label: React.PropType.string
      checkBoxes: React.PropType.array
    },

    mixins: [isValid],

    getInitialState: function () {
      return { value: [] };
    },

    val: function () {
      return this.state.value;
    },

    addItem: function (e) {
      var value = e.target.value;
      var index = this.state.value.indexOf(value);
      var isChecked = e.target.checked;

      this.setState(function (state) {
        if (isChecked && index < 0) {
          state.value.push(value);
        } else if (!isChecked && index > -1) {
          state.value.splice(index, 1);
        }
      });

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
              value={box.value}
              onClick={this.addItem} />
            <label htmlFor={box.name} >{box.label}</label>
          </div>
        );
      }.bind(this));

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
