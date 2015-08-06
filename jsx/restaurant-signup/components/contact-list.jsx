define(function(require, exports, module) {
  var React = require('react');
  var Contact = require('./contact');
  var isValid = require('../mixins/is-valid');

  module.exports = React.createClass({
    mixins: [isValid],

    propTypes: {
      contacts: React.PropTypes.array
    },

    getInitialState: function () {
      return { contacts: this.props.contacts || [{}] };
    },

    val: function () {
      return this.state.contacts;
    },

    addContact: function (e) {
      e.preventDefault();

      this.setState({
        contacts: this.state.contacts.concat({})
      });
    },

    render: function () {
      var contactList = this.state.contacts.map(function (contact, i) {
        return <Contact ref={"contact-"+i} key={i} contact={contact} />;
      }.bind(this));

      return (
        <div>
          <h2>Contacts</h2>
          {contactList}
          <button onClick={this.addContact}>+ add contact</button>
        </div>
      );
    }
  });
});
