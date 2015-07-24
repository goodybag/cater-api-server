define(function(require, exports, module) {
  var React = require('react');
  var Contact = require('./contact');

  module.exports = React.createClass({
    propTypes: {
      contacts: React.PropTypes.array
    },

    getInitialState: function () {
      return { contacts: this.props.contacts || [null] };
    },

    addContact: function (e) {
      e.preventDefault();

      this.setState({
        contacts: this.state.contacts.concat(null).reverse()
      });
    },

    render: function () {
      var contactList = this.state.contacts.map(function (contact) {
        return <Contact contact={contact} />;
      });

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
