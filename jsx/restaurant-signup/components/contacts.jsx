define(function(require, exports, module) {
  var React = require('react');
  var Input = require('./input');

  module.exports = React.createClass({
    propTypes: {
      contacts: React.PropTypes.array
    },

    getInitialState: function () {
      return {
        contacts: this.props.contacts || [{}]
      };
    },

    addContact: function (e) {
      e.preventDefault();

      this.setState({
        contacts: this.state.contacts.concat({}).reverse()
      });
    },

    getContactList: function () {
      return this.state.contacts.map(function (contact, i) {
        return (
          <div ref={"contact-"+i} key={i}>
            <p>Contact</p>
            <Input ref="name" label="Contact Name" value={contact.name || ''} />
            <Input ref="position" label="Contact Position" value={contact.position || ''} />
            <Input ref="number" label="Contact Number" value={contact.number || ''} />
            <Input ref="contact_email" label="Contact Email" value={contact.email || ''} />
          </div>
        );
      });
    },

    render: function () {
      return (
        <div>
          {this.getContactList()}
          <button key="add-contact-button" onClick={this.addContact}>+ add contact</button>
        </div>
      );
    }
  });
});