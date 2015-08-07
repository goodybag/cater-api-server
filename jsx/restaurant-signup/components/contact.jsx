define(function(require, exports, module) {
  var React = require('react');
  var Input = require('./input');
  var _ = require('lodash');

  module.exports = React.createClass({
    propTypes: {
      contact: React.PropTypes.object
    },

    getInitialState: function () {
      var contact = this.props.contact || {};

      _.defaults(contact, {
        name: ''
      , position: ''
      , number: ''
      , email: ''
      });

      return {
        contact: contact
      };
    },

    componentDidMount: function () {
      Array.prototype.slice.call(
        this.refs.contact.getDOMNode().querySelectorAll('input')
      ).forEach(function (input) {
        input.addEventListener('change', this.updateContact);
      }.bind(this));
    },

    updateContact: function (e) {
      e.preventDefault();

      this.setState(function (state) {
        state.contact[e.target.name] = e.target.value
      });
    },

    val: function () {
      return this.state.contact;
    },

    render: function () {
      return (
        <div ref="contact">
          <Input label="Contact Name" name="name" value={this.state.contact.name || ''} />
          <Input label="Contact Position" name="position" value={this.state.contact.position || ''} />
          <Input label="Contact Number" name="number" value={this.state.contact.number || ''} />
          <Input label="Contact Email" name="email" value={this.state.contact.email || ''} />
        </div>
      );
    }
  });
});